import { fabric } from "fabric";
import type { Bezier } from "bezier-js";
import { Warpvas, utils } from "warpvas";
import defaults from "lodash-es/defaults";
import type { FabricWarpvas } from "../fabric-warpvas.class";
import BaseMode, {
  BaseOptions,
  SUB_THEME_COLOR,
  THEME_COLOR,
} from "./base.class";
import {
  calcFabricRelativeCoord,
  calcFabricCanvasCoord,
  registerLimitMoveEvent,
} from "@utils";

const { calcMatrix } = utils;

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
 * 变形模式可自定义对象类型
 */
type WarpObjects = {
  /**
   * 可配置顶点控制点的方法
   * @param object - 默认的控制点对象
   * @returns 作为顶点控制点对象的fabric元素对象，可使用默认对象以外的新对象
   */
  control: (object: fabric.Object) => fabric.Object;
  /**
   * 可配置扭曲控制点的方法
   * @param object - 默认的控制点对象
   * @returns 作为扭曲控制点对象的fabric元素对象，可使用默认对象以外的新对象
   */
  curveControl: (object: fabric.Object) => fabric.Object;
  /**
   * 可配置插入控制点的方法
   * @param object - 默认的控制点对象
   * @returns 作为插入控制点对象的fabric元素对象，可使用默认对象以外的新对象
   */
  insertControl: (object: fabric.Object) => fabric.Object;
  /**
   * 可配置顶点控制点与扭曲控制点之间连线样式的方法
   * @param line - 连线对象
   */
  line: (line: fabric.Line) => void;
};

/**
 * 变形模式配置
 */
type WarpOptions = BaseOptions<{
  /**
   * 是否启用网格分割功能
   *
   * 启用后：
   * - 可以点击变形图像实现内部添加新的分割点
   * - 可以选中内部分割点并点击 Delete/Backspace 键删除
   * - 适用于需要更精细变形控制的场景
   *
   * @default true
   */
  enableGridSplit?: boolean;
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
 * 扭曲变形控制点数据结构
 *
 * 用于管理扭曲变形模式下的控制点及其相关数据。包含：
 *
 * 主控制点相关：
 * - majorControl: 主控制点对象（即顶点控制点）
 * - curve: 关联的贝塞尔曲线对象
 * - rowIndex: 网格行索引
 * - colIndex: 网格列索引
 * - splitDotRowIndex: 分割点行索引
 * - splitDotColIndex: 分割点列索引
 * - vertexIndex: 顶点在曲线上的索引位置
 * - vertexType: 顶点类型（左上/右上/左下/右下）
 *
 * 子控制点相关：
 * subControls: 子控制点对象数组（即曲线控制点）
 * - attach: [曲线对象, 顶点索引] 关联的曲线和顶点
 * - object: 控制点的 Fabric 对象
 * - line: 连接主控制点的连接线
 * - index: 控制点在曲线上的索引
 */
type Control = {
  majorControl: fabric.Object;
  curve: Bezier;
  rowIndex: number;
  colIndex: number;
  splitDotRowIndex: number;
  splitDotColIndex: number;
  vertexIndex: number;
  vertexType: VertexType;
  subControls: {
    attach: [curve: Bezier, vertexIndex: number];
    object: fabric.Object;
    line: fabric.Line;
    index: number;
  }[];
};

/**
 * 扭曲变形模式类
 *
 * 提供图像的扭曲变形功能。
 *
 * 交互说明：
 * 1. 拖动交互点实现扭曲点的变换，支持框选
 * 2. 点击内部区域，会出现临时交互点
 * 3. 拖动临时交互点实现整体移动
 * 4. 点击临时交互点实现变形区域分割
 * 5. 选中交互点后点击Delete实现扭曲点的删除（PS：四个原始对角交互点无法被删除）
 * 6. 按住设置按键限制控制点拖动只向水平或垂直方向移动（当 enableConstraintKey 设置为具体按键时生效）
 *

 * @example
 * ```typescript
 * import { fabric } from 'fabric';
 * import { FabricWarpvas } from 'fabric-warpvas';
 * import Warp from 'fabric-warpvas/modes/warp';
 *
 * // 创建 fabricWarpvas 实例
 * const canvas = new fabric.Canvas('canvas');
 * const fabricWarpvas = new FabricWarpvas(canvas);
 *
 * // 创建扭曲模式
 * const warp = new Warp({ themeColor: '#FF0000' });  // 交互元素使用红色主题色
 *
 * // 自定义模式中的控制点样式
 * warp.registerStyleSetter('control', (control) => {
 *     control.set({
 *       radius: 10,
 *       fill: 'blue',
 *       stroke: 'white'
 *     });
 *     return control;
 * });
 *
 * // 进入变形态
 * fabricWarpvas.enterEditing(image, null, warp);
 * ```
 *
 * @remarks 原始对象默认保持可见，需要手动隐藏
 *
 * @see
 * - {@link BaseMode} 变形模式基类
 * - {@link FabricWarpvas} 主要功能类
 */
class Warp extends BaseMode<WarpObjects, WarpOptions> {
  /**
   * 变形模式的唯一标识名称
   */
  public name = "warp";

  /**
   * 模式配置
   */
  public options: Required<WarpOptions> = {
    themeColor: THEME_COLOR,
    subThemeColor: SUB_THEME_COLOR,
    enableConstraintKey: "None",
    enableGridSplit: true,
  };

  /**
   * 样式设置器集合
   *
   * 用于自定义扭曲变形模式中各种元素的样式：
   * - image: 变形后的贴图样式
   * - path: 网格边界线的样式
   * - control: 顶点控制点的样式
   * - curveControl: 曲线控制点的样式
   * - insertControl: 临时控制点（中间插入点）的样式
   * - line: 控制点连接线的样式
   */
  protected _styleSetters = {
    image: () => {},
    path: () => {},
    control: (control: fabric.Object) => control,
    curveControl: (control: fabric.Object) => control,
    insertControl: (control: fabric.Object) => control,
    line: (line: fabric.Line) => {},
  };

  /**
   * 控制点位置映射表
   *
   * 存储控制点与其位置信息的映射关系：
   * - 键：由 "行-列" 组成的字符串，如 "0-1" 表示第0行第1列
   * - 值：{@link Control} 类型的控制点数据结构
   */
  private _positionControlMap = new Map<
    string, // `行-列`
    Control
  >([]);

  /**
   * 当前激活的插入控制点
   *
   * 用于临时存储当前正在交互的插入点对象。
   * 当用户点击贴图内部时创建，确认插入或取消时清除。
   */
  private _insertControlObject: fabric.Object | null = null;

  /**
   * 创建扭曲变形模式实例
   *
   * 初始化一个新的扭曲变形模式。
   */
  constructor(options: Partial<WarpOptions> = {}) {
    super(options);

    this.options = defaults(options, this.options);
  }

  /**
   * 计算贴图的分割点坐标
   *
   * 根据贴图的网格曲线计算分割点的位置坐标。该方法会：
   * 1. 遍历所有网格单元
   * 2. 计算横向和纵向曲线的交点
   * 3. 生成用于变形的控制点网格
   *
   * @param warpvas - 需要进行变形的贴图对象
   * @returns {Coord[][][]} 返回三维数组：
   * - 第一维：行索引
   * - 第二维：列索引
   * - 第三维：分割点坐标 {x, y}
   */
  static execute(warpvas: Warpvas): Coord[][][] {
    const curves = warpvas.regionCurves;
    if (!curves) return [];

    const splitPoints: Coord[][][] = [];

    warpvas.regionBoundaryCurves.forEach((row, rowIndex) => {
      const _row: Coord[][] = [];
      row.forEach((col, colIndex) => {
        const _col: Coord[] = [];
        const { vertical, horizontal } =
          warpvas.regionCurves[rowIndex][colIndex];
        for (let h = 0; h < horizontal.length; h++) {
          for (let v = 0; v < vertical.length; v++) {
            const point1 = vertical[v].get(h / (horizontal.length - 1));
            const point2 = horizontal[h].get(v / (vertical.length - 1));
            _col.push({
              x: (point1.x + point2.x) / 2,
              y: (point1.y + point2.y) / 2,
            });
          }
        }
        _row.push(_col);
      });
      splitPoints.push(_row);
    });

    return splitPoints;
  }

  /**
   * 获取所有顶点控制点
   *
   * 返回所有用于控制贴图顶点的主控制点对象列表。
   * 这些控制点位于贴图的四个角和边缘分割点位置。
   *
   * @returns {fabric.Object[]} 顶点控制点对象数组
   */
  get controlObjects(): fabric.Object[] {
    return Array.from(this._positionControlMap.values()).map(
      (item) => item.majorControl,
    );
  }

  /**
   * 获取所有曲线控制点
   *
   * 返回所有用于调整曲线形状的次要控制点对象列表。
   * 这些控制点位于边缘曲线的中间位置，用于调整曲线的弯曲程度。
   *
   * @returns {fabric.Object[]} 曲线控制点对象数组
   */
  get subControlObjects(): fabric.Object[] {
    return Array.from(this._positionControlMap.values())
      .map((item) => item.subControls.map((i) => i.object))
      .flat(1);
  }

  /**
   * 获取当前激活的插入控制点
   *
   * 返回当前正在交互的插入点对象。
   * 当用户点击贴图内部时会创建此控制点，
   * 用户可以通过点击它来在该位置添加新的分割点。
   *
   * @returns {fabric.Object | null} 插入控制点对象，如果不存在则返回 null
   */
  get insertControlObject(): fabric.Object | null {
    return this._insertControlObject;
  }

  /**
   * 获取所有控制点连接线
   *
   * 返回所有连接主控制点和曲线控制点的线段对象列表。
   * 这些线段用于可视化控制点之间的关系。
   *
   * @returns {fabric.Line[]} 连接线对象数组
   */
  get lineObjects(): fabric.Line[] {
    return Array.from(this._positionControlMap.values())
      .map((item) => item.subControls.map((i) => i.line))
      .flat(1);
  }

  /**
   * 执行扭曲变形计算
   *
   * 代理方法，调用静态方法 {@link Warp.execute} 进行实际的扭曲变形计算。
   *
   * @param warpvas - 需要进行扭曲变形的贴图对象
   * @returns 返回计算后的网格分割点坐标数组
   *
   * @see {@link Warp.execute} 具体实现细节
   */
  execute(warpvas: Warpvas) {
    return Warp.execute(warpvas);
  }

  /**
   * 在脏渲染后执行的钩子，用于渲染变形的交互元素
   *
   * @param fabricWarpvas - FabricWarpvas 实例，提供操作接口
   * @returns 清理函数，用于移除所有控制元素和事件监听
   *
   * @example
   * ```typescript
   * // 进入交互会自动调用
   * const cleanup = warp.dirtyRender(fabricWarpvas);
   *
   * // 退出交互时清理
   * cleanup();
   * ```
   */
  dirtyRender(fabricWarpvas: FabricWarpvas) {
    const fabricCanvas = fabricWarpvas.canvas;
    if (!fabricCanvas) return;

    const areaBounds = fabricWarpvas.warpvas?.regionBoundaryCurves;
    if (!areaBounds) return;

    // 交互元素
    const allObjects: fabric.Object[] = [];

    // 操作对象与控制器映射
    const objectControlMap = new Map<fabric.Object, string>();

    // 插入交互点
    this._insertControlObject = this._styleSetters.insertControl(
      this._createDefaultInsertControl(this.options.themeColor),
    );

    // 更新元素次序（主要控制点在最上层，次要控制点在第二层，连接线在第三层）
    const restoreObjectsOrder = () => {
      fabricCanvas.renderOnAddRemove = false;
      this._positionControlMap.forEach((item) => {
        item.subControls.forEach((i) => i.line.canvas?.bringToFront(i.line));
      });
      this._positionControlMap.forEach((item) => {
        item.subControls.forEach((i) =>
          i.object.canvas?.bringToFront(i.object),
        );
      });
      this._positionControlMap.forEach((item) => {
        item.majorControl.canvas?.bringToFront(item.majorControl);
      });
      this._insertControlObject?.canvas?.bringToFront(
        this._insertControlObject,
      );
      fabricCanvas.renderOnAddRemove = true;
      fabricCanvas.requestRenderAll();
    };

    // 添加所有交互点
    areaBounds.forEach((row, rowIndex) => {
      row.forEach((col, colIndex) => {
        const bounds = col;
        const directionBeziers = Object.entries(bounds);
        directionBeziers.forEach(([direction]) => {
          const curve = bounds[direction] as Bezier;

          // 添加曲线的控制点和控制线
          const path = fabricWarpvas.curvePathMap.get(curve)!;

          // 在画布的实际坐标
          const points = curve.points.map((point: Coord) =>
            fabric.util.transformPoint(
              new fabric.Point(
                point.x - path.pathOffset.x,
                point.y - path.pathOffset.y,
              ),
              path.calcOwnMatrix(),
            ),
          );

          // 给曲线添加两端控制点
          points.forEach((point, index) => {
            if (index === 0 || index === 3) return;

            // 归属的顶点
            const vertexIndex = [0, 0, 3, 3][index];
            const vertexPoint = points[vertexIndex];

            // 所属顶点类型
            const vertexType = {
              top: [VertexType.TOP_LEFT, VertexType.TOP_RIGHT],
              bottom: [VertexType.BOTTOM_LEFT, VertexType.BOTTOM_RIGHT],
              right: [VertexType.TOP_RIGHT, VertexType.BOTTOM_RIGHT],
              left: [VertexType.TOP_LEFT, VertexType.BOTTOM_LEFT],
            }[direction]![Math.sign(vertexIndex)];

            // 构建位置ID
            const positionRow = rowIndex + (vertexType.startsWith("b") ? 1 : 0);
            const positionCol = colIndex + (vertexType.endsWith("r") ? 1 : 0);
            const positionID = `${positionRow}-${positionCol}`;

            // 如果已经存在对应顶点元素则直接复用
            let controlPostionMap = this._positionControlMap.get(positionID);
            if (!controlPostionMap) {
              const control = this._styleSetters.control(
                this._createDefaultControl(this.options.themeColor),
              );
              control.set({
                left: vertexPoint.x,
                top: vertexPoint.y,
              });
              fabricCanvas.add(control);
              allObjects.push(control);
              controlPostionMap = {
                majorControl: control,
                curve,
                rowIndex,
                colIndex,
                splitDotRowIndex: positionRow,
                splitDotColIndex: positionCol,
                vertexIndex,
                vertexType,
                subControls: [],
              };
            }

            // 判断是否已经有重复的中间控制点
            const hadCreated = controlPostionMap.subControls.find((item) => {
              return item.attach[0] === curve && item.attach[1] === vertexIndex;
            });
            if (!hadCreated) {
              const subControl = this._styleSetters.curveControl(
                this._createDefaultCurveControl(),
              );
              subControl.set({
                left: point.x,
                top: point.y,
              });

              // 连接线
              const line = new fabric.Line(
                [point.x, point.y, vertexPoint.x, vertexPoint.y],
                {
                  stroke: "rgba(200, 200, 200, 0.8)",
                  strokeWidth: 1,
                  strokeUniform: true,
                  visible: false,
                  evented: false,
                  selectable: false,
                  originX: "center",
                  originY: "center",
                },
              );
              this._styleSetters.line(line);
              fabricCanvas.add(line, subControl);
              allObjects.push(line, subControl);
              controlPostionMap.subControls.push({
                attach: [curve, vertexIndex],
                object: subControl,
                line,
                index,
              });
            }

            this._positionControlMap.set(positionID, controlPostionMap);
            objectControlMap.set(controlPostionMap.majorControl, positionID);
          });
        });
      });
    });
    restoreObjectsOrder();

    // 添加交互事件
    this._positionControlMap.forEach((item) => {
      const { majorControl, subControls } = item;
      // 曲线控制点移动事件
      subControls.forEach(({ attach: [curve], object, line, index }) => {
        object.on("moving", () => {
          const path = fabricWarpvas.curvePathMap.get(curve)!;
          const point = calcFabricRelativeCoord(object, path);

          // 改变的距离
          const oldPoint = curve.points[index];
          const relativeDiff = {
            x: point.x - oldPoint.x,
            y: point.y - oldPoint.y,
          };
          object
            .set({
              // 角度保持和路径节点相向
              angle:
                90 +
                (Math.atan2(
                  object.top! - majorControl.top!,
                  object.left! - majorControl.left!,
                ) *
                  180) /
                  Math.PI,
            })
            .setCoords();
          curve.points[index].x += relativeDiff.x;
          curve.points[index].y += relativeDiff.y;

          line.set({
            x1: object.left,
            y1: object.top,
            x2: majorControl.left,
            y2: majorControl.top,
          });

          fabricWarpvas.requestRender(false, restoreObjectsOrder, {
            skipHistoryRecording: true,
          });
        });
      });
      // 控制点选中才显示曲线控制点
      majorControl.on("selected", () => {
        if (fabricCanvas.getActiveObject() === majorControl) {
          subControls.forEach(({ object, line }) => {
            object.set("visible", true);
            line.set("visible", true);
            majorControl.canvas?.requestRenderAll();
          });
        }
      });
      majorControl.on("deselected", () => {
        subControls.forEach(({ object, line }) => {
          object.set("visible", false);
          line.set("visible", false);
          majorControl.canvas?.requestRenderAll();
        });
      });
      subControls.forEach(({ object }) => {
        object.on("selected", () => {
          subControls.forEach(({ object, line }) => {
            object.set("visible", true);
            line.set("visible", true);
            object.canvas?.requestRenderAll();
          });
        });
        object.on("deselected", () => {
          subControls.forEach(({ object, line }) => {
            object.set("visible", false);
            line.set("visible", false);
            object.canvas?.requestRenderAll();
          });
        });
      });
    });

    // 注册控点变换事件
    const registerObjectTransformEvent = () => {
      const handleTransformTargets = () => {
        const selectObjects = fabricCanvas.getActiveObjects();
        const movingControlObjects = new Set<fabric.Object>();

        for (const object of selectObjects) {
          const id = objectControlMap.get(object);
          if (!id) continue;
          const control = this._positionControlMap.get(id);
          if (!control) continue;
          movingControlObjects.add(object);
        }

        Array.from(this._positionControlMap.values()).forEach((control) => {
          const isMoving = movingControlObjects.has(control.majorControl);

          // 如果不是移动的对象，不做更新操作
          if (!isMoving) return;

          const {
            curve,
            majorControl,
            rowIndex,
            colIndex,
            vertexType,
            vertexIndex,
            subControls,
          } = control;

          const path = fabricWarpvas.curvePathMap.get(curve)!;
          const transformInfo = fabric.util.qrDecompose(
            majorControl.calcTransformMatrix(false),
          );
          const absolutePosition = {
            left: transformInfo.translateX,
            top: transformInfo.translateY,
          };
          const point = calcFabricRelativeCoord(absolutePosition, path);

          // 记录旧的相对点和绝对位置
          const oldPoint = curve.points[vertexIndex];
          const oldPosition = fabric.util.transformPoint(
            new fabric.Point(
              oldPoint.x - path.pathOffset.x,
              oldPoint.y - path.pathOffset.y,
            ),
            path.calcOwnMatrix(),
          );

          // 改变的距离
          const relativeDiff = {
            x: point.x - oldPoint.x,
            y: point.y - oldPoint.y,
          };
          const absoluteDiff = {
            left: absolutePosition.left! - oldPosition.x,
            top: absolutePosition.top! - oldPosition.y,
          };
          fabricWarpvas.warpvas!.updateVertexCoord(
            rowIndex,
            colIndex,
            vertexType,
            point,
            false,
          );

          // 对应的控制点跟随变换
          subControls.forEach(({ attach, object, line, index }) => {
            attach[0].points[index].x += relativeDiff.x;
            attach[0].points[index].y += relativeDiff.y;

            object
              .set({
                left: object.left! + absoluteDiff.left,
                top: object.top! + absoluteDiff.top,
              })
              .setCoords();

            line.set({
              x1: object.left,
              y1: object.top,
              x2: absolutePosition.left,
              y2: absolutePosition.top,
            });
          });
        });

        if (movingControlObjects.size) {
          fabricWarpvas.requestRender(false, restoreObjectsOrder, {
            skipHistoryRecording: true,
          });
          movingControlObjects.clear();
        }
      };
      const handleSaveTransformRecord = (e: fabric.IEvent) => {
        const target = e.target;
        if (!target || e.action !== "drag") return;
        if (
          target.type === "activeSelection" &&
          (target as fabric.ActiveSelection)
            .getObjects()
            .some(this.controlObjects.includes.bind(this.controlObjects))
        ) {
          fabricWarpvas.record();
          return;
        }
        if (
          this.controlObjects.includes(target) ||
          this.subControlObjects.includes(target)
        ) {
          fabricWarpvas.record();
        }
      };
      fabricCanvas.on("object:moving", handleTransformTargets);
      fabricCanvas.on("object:modified", handleSaveTransformRecord);
      return () => {
        fabricCanvas.off("object:moving", handleTransformTargets);
        fabricCanvas.off("object:modified", handleSaveTransformRecord);
      };
    };

    // 注册插入点事件
    const registerInsertPointEvent = () => {
      let splitPointer: Coord | null = null;
      let splitPoint: Coord | null = null;
      let splitPointInfo: ReturnType<Warpvas["getHitInfo"]> = null;
      const handleMouseDown = (e: fabric.IEvent<Event>) => {
        // 仅左键有效
        if ((e as any).e.buttons !== 1) return;

        const mousedownStemp = performance.now();

        // 是否点击交互点
        const touchInteractPoint = e.target === this._insertControlObject;
        const touchWarpvasObject = e.target === fabricWarpvas.warpvasObject;
        if (e.pointer && this._insertControlObject) {
          if (touchInteractPoint) {
            fabricCanvas.selection = false;
          } else {
            splitPointer = null;
            splitPoint = null;
            splitPointInfo = null;
            fabricCanvas.remove(this._insertControlObject);
          }

          if (touchWarpvasObject) {
            const pointer = calcFabricCanvasCoord(fabricCanvas, e.pointer);
            const point = calcFabricRelativeCoord(
              { left: pointer.x, top: pointer.y },
              fabricWarpvas.paths![0],
            );
            splitPointInfo = fabricWarpvas.warpvas!.getHitInfo(point);
            if (splitPointInfo) {
              const { before, after, clickPart } = splitPointInfo;
              const matrix = calcMatrix(
                [
                  [after[0], after[1], after[3]],
                  [after[2], after[1], after[3]],
                ][clickPart] as [Coord, Coord, Coord],
                [
                  [before[0], before[1], before[3]],
                  [before[2], before[1], before[3]],
                ][clickPart] as [Coord, Coord, Coord],
              );
              splitPointer = pointer;
              splitPoint = fabric.util.transformPoint(
                point,
                fabric.util.invertTransform(matrix),
              );
            }
          }
        }

        // 添加整体移动交互
        const handleMouseMove = (e: fabric.IEvent<Event>) => {
          if (!e.pointer) return;
          if (fabricCanvas.selection) return;
          if (!this._insertControlObject) return;
          if (!touchInteractPoint) return;

          const warpvas = fabricWarpvas.warpvas;
          if (!warpvas) return;

          const pointer = calcFabricCanvasCoord(fabricCanvas, e.pointer);
          const offset = {
            x: pointer.x - this._insertControlObject.left!,
            y: pointer.y - this._insertControlObject.top!,
          };
          const bezierSet = new WeakSet<Bezier>([]);
          warpvas.forEachRegionBoundCoords(
            (rowIndex, colIndex, direction, bezier) => {
              // 避免重复处理
              if (bezierSet.has(bezier)) return bezier.points;
              bezierSet.add(bezier);
              const path = fabricWarpvas.curvePathMap.get(bezier)!;
              // 计算相对于变形对象自身的偏移
              const relativeOffset = fabric.util.transformPoint(
                new fabric.Point(offset.x, offset.y),
                fabric.util.invertTransform(path.calcOwnMatrix()),
                true,
              );
              return bezier.points.map((point) => {
                point.x += relativeOffset.x;
                point.y += relativeOffset.y;
                return point;
              });
            },
          );

          (
            [
              this._insertControlObject,
              fabricWarpvas.warpvasObject,
              ...(fabricWarpvas.paths ?? []),
              ...allObjects,
            ] as fabric.Object[]
          ).forEach((object) => {
            object
              .set({
                left: object.left! + offset.x,
                top: object.top! + offset.y,
              })
              .setCoords();
          });

          fabricWarpvas.requestRender(false, restoreObjectsOrder, {
            skipHistoryRecording: true,
          });
        };
        const handleMouseUp = (e: fabric.IEvent<Event>) => {
          const mouseupStemp = performance.now();
          const isClick = mouseupStemp - mousedownStemp < 200;
          if (isClick && e.pointer && this._insertControlObject) {
            // 点击交互点拆分贴图
            if (touchInteractPoint) {
              fabricCanvas.remove(this._insertControlObject);
              fabricWarpvas.warpvas?.splitRegionByPoint(
                splitPointInfo!.rowIndex,
                splitPointInfo!.colIndex,
                splitPoint!,
              );
              fabricWarpvas.render(true);
            }
            // 如果点击到贴图本身
            else if (splitPointer) {
              this._insertControlObject
                .set({
                  left: splitPointer.x,
                  top: splitPointer.y,
                })
                .setCoords();
              fabricCanvas.add(this._insertControlObject);
              fabricCanvas.requestRenderAll();
            }
          }
          if (touchInteractPoint) {
            fabricWarpvas.record();
          }

          fabricCanvas.selection = true;
          fabricCanvas.off("mouse:up", handleMouseUp);
          fabricCanvas.off("mouse:move", handleMouseMove);
        };
        fabricCanvas.on("mouse:move", handleMouseMove);
        fabricCanvas.on("mouse:up", handleMouseUp);
      };
      fabricCanvas.on("mouse:down", handleMouseDown);
      return () => {
        fabricCanvas.off("mouse:down", handleMouseDown);
      };
    };

    // 注册鼠标选中控点事件
    const registerSelectEvent = () => {
      const handleSelectTargets = () => {
        const selectObjects = fabricCanvas.getActiveObjects();
        const selectControlObjects = new Set<fabric.Object>();

        for (const object of selectObjects) {
          const id = objectControlMap.get(object);
          if (!id) continue;
          const control = this._positionControlMap.get(id);
          if (!control) continue;
          selectControlObjects.add(object);
        }

        Array.from(objectControlMap.keys()).forEach((object) => {
          object.set({
            opacity: 1,
            fill: selectControlObjects.has(object)
              ? this.options.subThemeColor
              : this.options.themeColor,
          });
        });

        if (selectControlObjects.size) {
          fabricCanvas.getActiveObject()?.set({
            perPixelTargetFind: true,
            hasControls: false,
            hasBorders: false,
          });
          selectControlObjects.clear();
        }

        fabricCanvas.requestRenderAll();
      };

      fabricCanvas.on("selection:created", handleSelectTargets);
      fabricCanvas.on("selection:updated", handleSelectTargets);
      fabricCanvas.on("selection:cleared", handleSelectTargets);

      return () => {
        fabricCanvas.off("selection:created", handleSelectTargets);
        fabricCanvas.off("selection:updated", handleSelectTargets);
        fabricCanvas.off("selection:cleared", handleSelectTargets);
      };
    };

    // 注册按下 Delete/Backspace 删除控件
    const registerDeleteEvent = () => {
      // 处理分割点删除
      const handleDeleteSplitPoint = (targets: fabric.Object[]) => {
        const controls: Control[] = [];
        for (const target of targets) {
          const id = objectControlMap.get(target);
          if (!id) continue;
          const control = this._positionControlMap.get(id);
          if (!control) continue;
          controls.push(control);
        }

        if (controls) {
          fabricWarpvas.warpvas?.removeRegion(
            ...controls.map((control) => ({
              row: control.splitDotRowIndex,
              column: control.splitDotColIndex,
            })),
          );
          fabricWarpvas.render(true);
        }
      };
      // 处理键盘按下事件
      const handleKeyDown = (e: KeyboardEvent) => {
        if (["Delete", "Backspace"].includes(e.key)) {
          const targets = (fabricCanvas as fabric.Canvas).getActiveObjects();
          if (!targets) return;
          handleDeleteSplitPoint(targets);
        }
      };
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    };

    // 注册各类事件并持有它们的取消注册回调
    const { enableConstraintKey, enableGridSplit } = this.options;
    const registers = [
      [
        enableConstraintKey.toUpperCase() !== "NONE",
        registerLimitMoveEvent(fabricCanvas, enableConstraintKey),
      ],
      [true, registerObjectTransformEvent],
      [true, registerSelectEvent],
      [enableGridSplit, registerInsertPointEvent],
      [enableGridSplit, registerDeleteEvent],
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
      if (this._insertControlObject) {
        fabricCanvas.remove(this._insertControlObject);
      }
      fabricCanvas.remove(...allObjects);

      // 释放内存
      this._positionControlMap.clear();
      objectControlMap.clear();
    };
  }

  /**
   * 创建变形模式默认的顶点控制点对象
   *
   * 创建一个圆形的控制点，用于作为顶点控制点提供拖拽变形的功能。
   *
   * @returns {fabric.Circle} 返回 Fabric.js 圆形对象
   */
  private _createDefaultControl(themeColor: string): fabric.Circle {
    return new fabric.Circle({
      radius: 4,
      fill: themeColor,
      stroke: "#ffffff",
      paintFirst: "fill",
      strokeWidth: 1,
      originX: "center",
      originY: "center",
      hasControls: false,
      hasBorders: false,
    });
  }

  /**
   * 创建变形模式默认的曲线控制点
   *
   * 创建一个矩形的控制点，用于调整边界曲线形状，显示在曲线的中间位置。
   *
   * @returns {fabric.Rect} 返回 Fabric.js 矩形对象
   */
  private _createDefaultCurveControl(): fabric.Rect {
    return new fabric.Rect({
      width: 6,
      height: 6,
      fill: "rgba(255, 255, 255, 1)",
      stroke: "rgba(200, 200, 200, 0.8)",
      strokeWidth: 1,
      strokeUniform: true,
      // shadow: '0 0 3px rgba(0, 0, 0, 0.6)',
      visible: false,
      hasControls: false,
      hasBorders: false,
      originX: "center",
      originY: "center",
    });
  }

  /**
   * 创建变形模式默认的中间临时点对象
   *
   * 创建一个圆形的控制点，用于标识可插入新控制点位置的指示器，点击后在该位置添加新的分割点，
   * 另外也可作为整体拓展的控制点。
   *
   * @returns {fabric.Circle} 返回 Fabric.js 圆形对象
   */
  private _createDefaultInsertControl(themeColor: string): fabric.Circle {
    return new fabric.Circle({
      radius: 4,
      fill: "rgba(255, 255, 255, 0.2)",
      stroke: themeColor,
      strokeWidth: 1,
      originX: "center",
      originY: "center",
      selectable: false,
      hasControls: false,
      hasBorders: false,
    });
  }
}

export default Warp;
