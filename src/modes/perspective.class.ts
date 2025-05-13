import { fabric } from "fabric";
import type { Bezier } from "bezier-js";
import type { Warpvas } from "warpvas";
import perspective from "warpvas-perspective";
import defaults from "lodash-es/defaults";
import type { FabricWarpvas } from "../fabric-warpvas.class";
import BaseMode, {
  BaseOptions,
  SUB_THEME_COLOR,
  THEME_COLOR,
} from "./base.class";
import {
  calcFabricCanvasCoord,
  calcFabricRelativeCoord,
  registerLimitMoveEvent,
} from "@utils";

/**
 * 变形区域的顶点类型枚举
 *
 * 用于标识变形区域四个角的位置。
 *
 * @enum {string}
 */
export enum VertexType {
  /** 左上角顶点 */
  TOP_LEFT = "tl",
  /** 右上角顶点 */
  TOP_RIGHT = "tr",
  /** 左下角顶点 */
  BOTTOM_LEFT = "bl",
  /** 右下角顶点 */
  BOTTOM_RIGHT = "br",
}

/**
 * 透视模式配置
 */
type PerspectiveOptions = BaseOptions<{
  /**
   * 是否启用空白区域拖拽实现整体变形
   *
   * @default true
   */
  enableDragResize?: boolean;
  /**
   * 空白区域拖拽实现整体变形的最小拖拽区域大小，默认 50 像素
   *
   * @default 50
   */
  minimumDragThreshold?: number;
  /**
   * 是否启用移动约束按键，默认禁用（None）
   *
   * 启用后：
   * - 移动控点时按键限制移动方向为水平或垂直
   * - 移动方向取决于拖拽距离较大的方向
   *
   * @default 'None' 表示禁用移动约束
   */
  enableConstraintKey?: string | "none";
}>;

/**
 * 透视变形模式
 *
 * 提供图像的透视变形功能，通过四个对角控制点实现自由透视效果。
 *
 * 交互说明：
 * 1. 拖动控制点实现透视的变换（PS：形成三角形后无法进一步透视变换）
 * 2. 空白区域持续拖拽形成整体变形（当 enableDragResize 为 true 时生效）
 * 3. 按住设置按键限制控制点拖动只向水平或垂直方向移动（当 enableConstraintKey 设置为具体按键时生效）
 *
 * @example
 * ```typescript
 * import { fabric } from 'fabric';
 * import { FabricWarpvas } from 'fabric-warpvas';
 * import Perspective from 'fabric-warpvas/modes/perspective';
 *
 * // 创建 fabricWarpvas 实例
 * const canvas = new fabric.Canvas('canvas');
 * const fabricWarpvas = new FabricWarpvas(canvas);
 *
 * // 创建透视模式
 * const perspective = new Perspective({ themeColor: '#FF0000' });  // 交互元素使用红色主题色
 *
 * // 自定义模式中的控制点样式
 * perspective.registerStyleSetter('control', (control) => {
 *     control.set({
 *       radius: 10,
 *       fill: 'blue',
 *       stroke: 'white'
 *     });
 *     return control;
 * });
 *
 * // 进入变形态
 * fabricWarpvas.enterEditing(image, null, perspective);
 * ```
 *
 * @remarks
 * 使用注意：四个对角控制点形成三角形后无法进一步拖拽，这会导致无效的透视效果
 */
class Perspective extends BaseMode<
  {
    /**
     * 配置对角控制点样式回调
     * @param object - 默认的控制点对象
     * @returns 作为控制点对象的fabric元素对象，可使用默认对象以外的新对象
     */
    control: (object: fabric.Object) => fabric.Object;
  },
  PerspectiveOptions
> {
  /**
   * 变形模式的唯一标识名称
   */
  public name = "perspective";

  /**
   * 模式配置
   */
  public options: Required<PerspectiveOptions> = {
    themeColor: THEME_COLOR,
    subThemeColor: SUB_THEME_COLOR,
    enableDragResize: true,
    minimumDragThreshold: 50,
    enableConstraintKey: "None",
  };

  /**
   * 控制点映射表
   *
   * 存储控制点与其相关数据的映射关系，包括：
   * - curve: 控制点所在的贝塞尔曲线
   * - targetPointIdx: 控制点在曲线上的索引位置
   * - rowIndex: 控制点所在的网格行索引
   * - colIndex: 控制点所在的网格列索引
   * - vertexType: 控制点的顶点类型（如左上、右上等）
   *
   * @internal 仅供内部使用
   */
  private _objectControlMap = new Map<
    fabric.Object,
    {
      curve: Bezier;
      targetPointIdx: number;
      rowIndex: number;
      colIndex: number;
      vertexType: VertexType;
    }
  >([]);

  /**
   * 样式设置器集合
   *
   * 用于自定义透视变形模式中各种元素的样式：
   * - image: 变形后的贴图样式
   * - path: 网格边界线的样式
   * - control: 配置对角控制点的样式
   */
  protected _styleSetters = {
    image: () => {},
    path: () => {},
    control: (control: fabric.Object) => control,
  };

  /**
   * 创建透视变形模式实例
   *
   * 初始化一个透视变形模式。
   */
  constructor(options: Partial<PerspectiveOptions> = {}) {
    super(options);

    this.options = defaults(options, this.options);
  }

  /**
   * 计算透视变形的网格分割点
   *
   * 该方法实现了透视变形的核心算法，依赖于 warpvas-perspective 库。
   *
   * @param warpvas - 需要进行透视变形的贴图对象
   * @returns 返回三维数组，表示网格的分割点坐标：
   * - 第一维：行索引
   * - 第二维：列索引
   * - 第三维：点的坐标 {x, y}
   *
   * @throws {Error} 当四个顶点形成无效的透视形状时抛出错误
   *
   * @remarks
   * 1. 顶点的移动范围会受到透视有效性的限制
   * 2. 当线条平行时会使用默认点代替交点
   */
  static execute(warpvas: Warpvas) {
    return perspective.execute(warpvas);
  }

  /**
   * 获取当前所有的控制点对象
   *
   * 返回当前透视变形模式中的所有控制点对象。
   *
   * @returns {fabric.Object[]} 返回所有控制点对象的数组
   *
   * @example
   * ```typescript
   * // 1.隐藏所有控制点
   * perspective.controlObjects.forEach(control => {
   *   control.set({ visible: false });
   * });
   * canvas.renderAll();
   *
   * // 2.将所有控制点移到最上层
   * perspective.controlObjects.forEach(control => {
   *   canvas.bringToFront(control);
   * });
   * ```
   */
  get controlObjects(): fabric.Object[] {
    return Array.from(this._objectControlMap.keys());
  }

  /**
   * 执行透视变形计算
   *
   * 代理方法，调用静态方法 {@link Perspective.execute} 进行实际的透视变形计算。
   *
   * @param warpvas - 需要进行透视变形的贴图对象
   * @returns 返回计算后的网格分割点坐标数组
   *
   * @see {@link Perspective.execute} 具体实现细节
   */
  execute(warpvas: Warpvas) {
    return Perspective.execute(warpvas);
  }

  /**
   * 在脏渲染后执行的钩子，用于渲染透视变形的交互元素
   *
   * @param fabricWarpvas - FabricWarpvas 实例，提供操作接口
   * @returns 返回清理函数，用于移除所有控制点和事件监听器
   *
   * @example
   * ```typescript
   * // 进入交互会自动调用
   * const cleanup = perspective.dirtyRender(fabricWarpvas);
   *
   * // 退出交互时清理
   * cleanup();
   * ```
   *
   * @remarks
   * 无效的透视变形会自动回退到上一个有效状态
   */
  dirtyRender(fabricWarpvas: FabricWarpvas) {
    const fabricCanvas = fabricWarpvas.canvas;
    if (!fabricCanvas) return;

    const areaBounds = fabricWarpvas.warpvas?.regionBoundaryCurves;
    if (!areaBounds) return;

    areaBounds.forEach((row, rowIndex) => {
      row.forEach((col, colIndex) => {
        const bounds = col;
        Object.entries(bounds).forEach(([direction]) => {
          const curve = bounds[direction] as Bezier;

          // 坐标类型
          const type = (
            {
              top: VertexType.TOP_LEFT,
              bottom: VertexType.BOTTOM_RIGHT,
              right: VertexType.TOP_RIGHT,
              left: VertexType.BOTTOM_LEFT,
            } as const
          )[direction] as VertexType;

          // 添加曲线的控制点和控制线
          const path = fabricWarpvas.curvePathMap.get(curve)!;
          const points = curve.points.map((point: Coord) =>
            fabric.util.transformPoint(
              new fabric.Point(
                point.x - path.pathOffset.x,
                point.y - path.pathOffset.y,
              ),
              path.calcOwnMatrix(),
            ),
          );

          // 控制点
          const control = this._styleSetters.control(
            this._createDefaultControl(),
          );
          const dotPosition = (
            {
              top: "first",
              right: "first",
              bottom: "last",
              left: "last",
            } as const
          )[direction]!;
          const targetPointIdx = { first: 0, last: 3 }[dotPosition]!;

          control.set({
            left: points[targetPointIdx].x,
            top: points[targetPointIdx].y,
          });

          fabricCanvas.add(control);
          this._objectControlMap.set(control, {
            curve,
            targetPointIdx,
            rowIndex,
            colIndex,
            vertexType: type,
          });
        });
      });
    });

    // 注册控点变换事件
    const registerObjectTransformEvent = () => {
      const handleMovingControl = (e: fabric.IEvent<Event>) => {
        if (!e.target) return;

        const control = this._objectControlMap.get(e.target);
        if (!control) return;

        const object = e.target;
        const { curve, targetPointIdx, rowIndex, colIndex, vertexType } =
          control;
        const path = fabricWarpvas.curvePathMap.get(curve)!;
        const pathMatrix = path.calcOwnMatrix();
        const point = calcFabricRelativeCoord(object, path);

        // 记录旧的位置，如果无效变换则复原原位置
        const cachePoint = { ...curve.points[targetPointIdx] };
        try {
          fabricWarpvas.warpvas!.updateVertexCoord(
            rowIndex,
            colIndex,
            vertexType,
            point,
          );
          fabricWarpvas.render(false, { skipHistoryRecording: true });
        } catch {
          // 复原点的位置
          fabricWarpvas.warpvas!.updateVertexCoord(
            rowIndex,
            colIndex,
            vertexType,
            cachePoint,
          );
          fabricWarpvas.render(false, { skipHistoryRecording: true });
          const points = curve.points.map((point) =>
            fabric.util.transformPoint(
              new fabric.Point(
                point.x - path.pathOffset.x,
                point.y - path.pathOffset.y,
              ),
              pathMatrix,
            ),
          );
          object.set({
            left: points[targetPointIdx].x,
            top: points[targetPointIdx].y,
          });
          object.setCoords();
        } finally {
          // 如果有控制元素，必须放在最顶端
          this.controlObjects.forEach((object) => {
            fabricCanvas.bringToFront(object);
          });
        }
      };

      // 记录变换数据
      const handleSaveTransformRecord = (e: fabric.IEvent) => {
        const target = e.target;
        if (!target || e.action !== "drag") return;
        if (this.controlObjects.includes(target)) {
          fabricWarpvas.record();
        }
      };
      fabricCanvas.on("object:moving", handleMovingControl);
      fabricCanvas.on("object:modified", handleSaveTransformRecord);
      return () => {
        fabricCanvas.off("object:moving", handleMovingControl);
        fabricCanvas.off("object:modified", handleSaveTransformRecord);
      };
    };

    // 注册拖动修改透视位置事件
    const registerDragResizeEvent = () => {
      // 添加拖动修改透视位置事件
      const handleMoveDownBefore = (e: fabric.IEvent<Event>) => {
        // 仅左键有效
        if ((e as any).e.buttons !== 1) return;
        if (e.target && e.target.selectable) return;

        const { minimumDragThreshold } = this.options;

        let hasResized = false;

        fabricCanvas.selection = false;
        const leftTop = calcFabricCanvasCoord(fabricCanvas, e.pointer!);

        const handleMove = (e: fabric.IEvent<Event>) => {
          const bottomRight = calcFabricCanvasCoord(fabricCanvas, e.pointer!);

          // 尺寸太小不进行操作
          if (
            !hasResized &&
            (Math.abs(bottomRight.x - leftTop.x) < minimumDragThreshold ||
              Math.abs(bottomRight.y - leftTop.y) < minimumDragThreshold)
          )
            return;

          const leftTopPoint = calcFabricRelativeCoord(
            { left: leftTop.x, top: leftTop.y },
            fabricWarpvas.curvePathMap.get(
              fabricWarpvas.warpvas!.regionBoundaryCurves[0][0].top,
            )!,
          );
          const bottomRightPoint = calcFabricRelativeCoord(
            { left: bottomRight.x, top: bottomRight.y },
            fabricWarpvas.curvePathMap.get(
              fabricWarpvas.warpvas!.regionBoundaryCurves[0][0].bottom,
            )!,
          );

          fabricWarpvas.warpvas!.updateVertexCoord(
            0,
            0,
            VertexType.TOP_LEFT,
            leftTopPoint,
          );
          fabricWarpvas.warpvas!.updateVertexCoord(0, 0, VertexType.TOP_RIGHT, {
            x: bottomRightPoint.x,
            y: leftTopPoint.y,
          });
          fabricWarpvas.warpvas!.updateVertexCoord(
            0,
            0,
            VertexType.BOTTOM_LEFT,
            {
              x: leftTopPoint.x,
              y: bottomRightPoint.y,
            },
          );
          fabricWarpvas.warpvas!.updateVertexCoord(
            0,
            0,
            VertexType.BOTTOM_RIGHT,
            bottomRightPoint,
          );
          fabricWarpvas.render(true, { skipHistoryRecording: true });

          hasResized = true;
        };

        const handleUp = (e: fabric.IEvent<Event>) => {
          if (hasResized) fabricWarpvas.record();
          fabricCanvas.selection = true;
          fabricCanvas.off("mouse:move", handleMove);
          fabricCanvas.off("mouse:up", handleUp);
        };

        fabricCanvas.on("mouse:move", handleMove);
        fabricCanvas.on("mouse:up", handleUp);
      };
      fabricCanvas.on("mouse:down:before", handleMoveDownBefore);

      return () => {
        fabricCanvas.off("mouse:down:before", handleMoveDownBefore);
      };
    };

    // 注册各类事件并持有它们的取消注册回调
    const { enableDragResize, enableConstraintKey } = this.options;

    const registers = [
      [
        enableConstraintKey.toUpperCase() !== "NONE",
        registerLimitMoveEvent(fabricCanvas, enableConstraintKey),
      ],
      [enableDragResize, registerDragResizeEvent],
      [true, registerObjectTransformEvent],
    ] as const;

    const unregisters = registers.map(
      ([enable, register]) => enable && register(),
    );

    return () => {
      // 取消各类事件注册
      unregisters.forEach((unregister) => {
        if (typeof unregister === "function") unregister();
      });

      // 移除所有交互元素
      fabricCanvas.remove(...this._objectControlMap.keys());
      this._objectControlMap.clear();
    };
  }

  /**
   * 创建透视模式默认的顶点控制点对象
   *
   * 创建一个圆形的控制点，用于作为顶点控制点提供拖拽变形的功能。
   *
   * @returns {fabric.Circle} 返回一个 fabric.Circle 实例作为控制点
   */
  private _createDefaultControl(): fabric.Circle {
    return new fabric.Circle({
      radius: 4,
      fill: this.options.themeColor,
      stroke: "#ffffff",
      paintFirst: "fill",
      strokeWidth: 1,
      originX: "center",
      originY: "center",
      hasControls: false,
      hasBorders: false,
    });
  }
}

export default Perspective;
