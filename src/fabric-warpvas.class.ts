import { fabric } from 'fabric';
import cloneDeep from 'lodash-es/cloneDeep';
import defaults from 'lodash-es/defaults';
import { Warpvas } from 'warpvas';
import type { AbstractMode } from './abstract-mode.class';
import type { WarpState } from 'warpvas/dist/warpvas.class';
import type { Bezier } from 'bezier-js';

/**
 * FabricWarpvas 实例的配置选项
 *
 * 定义初始化 FabricWarpvas 实例时的配置选项，包括：
 * - 历史记录功能的开关
 * - 历史记录变化的事件监听
 *
 * @example
 * ```typescript
 * const fabricWarpvas = new FabricWarpvas(canvas, {
 *   // 启用变形历史记录，启用后会记录每次变形的变形数据，可用于撤回或重做
 *   enableHistory: true,
 *
 *   // 监听历史记录变化
 *   onHistoryChange: ({ undo, redo }) => {
 *     // 根据历史记录状态更新 UI
 *   }
 * });
 * ```
 */
type FabricWarpvasOptions = {
  /**
   * 是否启用变形操作的历史记录
   *
   * 启用后，实例将维护一个变形状态的撤销/重做栈，
   * 可以使用相关 API 撤回（undo）或重做（redo/reset）他们的变形操作。
   *
   * @default false
   *
   * @remarks 启用历史记录会消耗额外的内存来存储过程变形数据。
   */
  enableHistory: boolean;

  /**
   * 历史记录变化时的回调函数
   *
   * @param records 当前的历史记录栈
   * @param records.undo 可撤销的变形记录栈
   * @param records.redo 可重做的变形记录栈
   *
   * @remarks undo 数组的第一项始终是初始状态的变形数据
   */
  onHistoryChange: (records: { undo: WarpState[]; redo: WarpState[] }) => void;
};

/**
 * 图像渲染选项
 */
type RenderOptions = {
  /**
   * 是否跳过记录此次渲染的变形状态
   *
   * 设为 true 时，本次渲染不会被添加到记录栈中。
   * 常用于以下场景：
   * - 临时预览渲染
   * - 恢复历史状态时的渲染
   * - 重置变形时的渲染
   *
   * @default false
   */
  skipHistoryRecording: boolean;
};

/**
 * Fabric.js 变形工具类
 *
 * 为 Fabric.js 对象提供快捷的变形功能，支持：
 * - 网格化变形：将图像划分为多个可调整的变形网格
 * - 交互式编辑：支持拖拽交互调整变形效果
 * - 历史记录：支持撤销/重做/重置操作
 * - 性能优化：自动压缩大尺寸图像，优化渲染性能
 *
 * @example
 * ```typescript
 * import { FabricWarpvas } from 'fabric-warpvas';
 * import Warp from 'fabric-warpvas/modes/warp';
 *
 * // 1. 创建 Fabric.js 画布
 * const canvas = new fabric.Canvas('canvas');
 *
 * // 2. 初始化变形工具
 * const fabricWarpvas = new FabricWarpvas(canvas, {
 *   enableHistory: true, // 启用历史记录
 * });
 *
 * // 3. 准备需要变形的 fabric 元素对象，不限于图像元素
 * const image = new fabric.Image(imageElement);
 * canvas.add(image);
 *
 * // 4. 进入扭曲变形模式
 * fabricWarpvas.enterEditing(image, null, new Warp());
 *
 * // 5. 完成编辑后退出
 * fabricWarpvas.leaveEditing();
 * ```
 *
 * @remarks 使用前请确保已正确安装并引入 fabric.js
 *
 * @see AbstractMode 查看如何自定义变形模式
 * @see Warpvas 了解底层变形实现
 */
export class FabricWarpvas {
  /**
   * Fabric.js 画布实例，作为变形的载体画布
   */
  canvas: fabric.Canvas;

  /**
   * 实例配置选项，包含历史记录开关和变化监听器等配置
   */
  options: FabricWarpvasOptions;

  /**
   * 核心变形引擎实例，负责处理底层的图像变形计算
   * @default null
   */
  warpvas: Warpvas | null = null;

  /**
   * 当前正在编辑的 Fabric 对象，可以是任何 Fabric.js 对象类型（图片、文本等）
   * @default null
   */
  target: fabric.Object | null = null;

  /**
   * 目标对象的画布表示，存储目标对象的原始图像数据
   * @default null
   */
  targetCanvas: HTMLCanvasElement | null = null;

  /**
   * 变形后的图像对象，在画布上显示的实际图像对象
   */
  warpvasObject?: fabric.Image;

  /**
   * 网格路径元素列表，存储所有用于表示网格线的 Fabric.Path 对象
   * @remarks 用于显示变形网格和处理交互
   */
  paths?: fabric.Path[];

  /**
   * 贝塞尔曲线到路径对象的映射，用于快速查找曲线对应的路径对象
   */
  curvePathMap = new WeakMap<Bezier, fabric.Path>();

  /**
   * 路径对象到贝塞尔曲线的映射，用于快速查找路径对应的曲线对象
   */
  pathCurveMap = new WeakMap<fabric.Path, Bezier>();

  /**
   * 当前激活的变形模式，控制图像变形的交互方式和效果
   * @default null
   */
  mode: AbstractMode | null = null;

  /**
   * 图像的边界范围 记录变形区域的边界坐标，用于计算位置偏移
   * @property {number} left - 左边界坐标
   * @property {number} right - 右边界坐标
   * @property {number} top - 上边界坐标
   * @property {number} bottom - 下边界坐标
   */
  private _warpvasBoundary?: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };

  /**
   * 图像在水平方向的缩放比例，用于保持变形后的图像与原始尺寸的比例关系
   * @default 1
   */
  private _warpvasScaleX = 1;

  /**
   * 图像在垂直方向的缩放比例，用于保持变形后的图像与原始尺寸的比例关系
   * @default 1
   */
  private _warpvasScaleY = 1;

  /**
   * 变形数据记录
   * @property {WarpState[]} undo - 可撤销的变形记录栈
   * @property {WarpState[]} redo - 可重做的变形记录栈
   */
  private _records: {
    undo: WarpState[];
    redo: WarpState[];
  } = {
    undo: [],
    redo: [],
  };

  /**
   * 普通渲染的清理回调函数
   *
   * 存储渲染过程中创建的交互元素的清理函数。
   * 在下次渲染前或离开编辑态时会被调用，可用于清理上一次渲染的交互元素。
   *
   * @private
   * @type {(() => void) | void}
   */
  private _renderReturnCallback?: (() => void) | void;

  /**
   * 脏渲染的清理回调函数
   *
   * 存储脏渲染（结构发生变化，比如添加或删除了区域分割点）时创建的交互元素的清理函数。
   * 在下次脏渲染前或离开编辑态时会被调用，可用于清理上一次渲染的交互元素。
   *
   * @private
   * @type {(() => void) | void}
   */
  private _dirtyRenderReturnCallback?: (() => void) | void;

  /**
   * 下一帧渲染的请求标识
   *
   * 存储 requestAnimationFrame 返回的标识符。
   * 用于在需要时取消已计划但尚未执行的渲染操作，避免不必要的渲染和性能浪费。
   *
   * @private
   * @type {number | undefined}
   */
  private _nextFrameRender: number | undefined;

  /**
   * 创建 FabricWarpvas 实例
   *
   * 初始化一个变形工具实例，该实例将与指定的 Fabric.js 画布关联，用于处理画布上的元素变形操作。
   *
   * @param canvas - Fabric.js 画布实例
   * @param [options] - 配置选项
   * @param [options.enableHistory=false] - 是否启用操作历史记录
   * @param [options.onHistoryChange] - 历史记录变化时的回调函数
   *
   * @example
   * ```typescript
   * const canvas = new fabric.Canvas('canvas');
   * const warpvas = new FabricWarpvas(canvas);
   * ```
   *
   * @remarks
   * 1. 创建实例后，需要调用 enterEditing 方法才能开始编辑
   * 2. 启用历史记录会消耗额外的内存，请根据实际需求选择是否启用
   */
  constructor(canvas: fabric.Canvas, options: Partial<FabricWarpvasOptions> = {}) {
    // 检查 fabric.js 是否存在
    if (typeof fabric === 'undefined') {
      throw new Error(
        '[Fabric-Warpvas] fabric.js is required for FabricWarpvas class.\n' +
          'Please install and import fabric.js first.',
      );
    }

    // 检查传入的 canvas 是否是有效的 fabric.Canvas 实例
    if (!(canvas instanceof fabric.Canvas)) {
      throw new Error(
        '[Fabric-Warpvas] Invalid canvas parameter.\n' +
          'Please provide a valid fabric.Canvas instance.',
      );
    }

    this.canvas = canvas;
    this.options = defaults(options, {
      enableHistory: false,
      onHistoryChange: () => {},
    });
  }

  /**
   * 渲染变形效果
   *
   * 将当前的变形状态渲染到画布上。
   *
   * @param [dirty=true] - 是否为脏渲染，脏渲染会导致 _dirtyRenderReturnCallback 回调执行
   * @param [options] - 渲染配置选项
   * @param [options.skipHistoryRecording=false] - 是否跳过记录此次渲染的变形状态
   *
   * @example
   * ```typescript
   * // 普通渲染（仅网格分割点位置变化）
   * fabricWarpvas.render(false);
   *
   * // 脏渲染（网格结构发生变化，如添加或删除了分割点）
   * fabricWarpvas.render(true);
   *
   * // 临时预览渲染（不记录历史）
   * fabricWarpvas.render(true, { skipHistoryRecording: true });
   * ```
   *
   * @remarks
   * 1. 脏渲染会重建整个变形网格结构，性能消耗较大
   * 2. 非脏渲染仅更新现有网格的控制点位置，性能消耗较小
   * 3. 如果不需要记录历史，建议设置 skipHistoryRecording 为 true
   *
   * @see requestRender 性能优化版本的渲染方法
   */
  render(dirty = true, options: Partial<RenderOptions> = {}) {
    if (!this.warpvas) return;

    if (!this.target) return;

    const canvas = this.canvas;
    if (!canvas) return;

    const object = this.target;
    if (!object) return;

    // 执行销毁回调
    canvas.renderOnAddRemove = false;
    if (dirty && this._dirtyRenderReturnCallback) {
      this._dirtyRenderReturnCallback();
      this._dirtyRenderReturnCallback = undefined;
    }
    if (this._renderReturnCallback) {
      this._renderReturnCallback();
      this._renderReturnCallback = undefined;
    }

    // 添加新的元素
    const warpvasCanvas = this.warpvas.render();
    console.log(warpvasCanvas);

    // 记录变形操作数据
    if (!options.skipHistoryRecording) this.record();

    // 创建对应路径列表
    const paths: fabric.Path[] = [];
    const curvePathMap = new WeakMap<Bezier, fabric.Path>();
    const pathCurveMap = new WeakMap<fabric.Path, Bezier>();

    const rowCount = this.warpvas.regionCurves.length;
    const colCount = this.warpvas.regionCurves[0].length;
    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < colCount; col++) {
        const curves = this.warpvas.regionCurves[row][col];
        Object.values(curves).forEach((curves) => {
          const length = curves.length;
          for (let i = 0; i < length; i++) {
            const curve = curves[i];
            // 重叠的路径不重复创建
            if (curvePathMap.has(curve)) continue;
            const path = new fabric.Path(curve.toSVG());
            paths.push(path);
            curvePathMap.set(curve, path);
            pathCurveMap.set(path, curve);
          }
        });
      }
    }

    // 成组形成网格元素后抵消偏移使网格元素和源目标元素重合
    const grip = new fabric.Group(paths);
    const { width: gridWidth = 0, height: gridHeight = 0 } = grip;
    const { left: gridOffsetX = 0, top: gridOffsetY = 0 } = grip;

    const _warpvasBoundary = {
      left: gridOffsetX,
      right: gridOffsetX + gridWidth,
      top: gridOffsetY,
      bottom: gridOffsetY + gridHeight,
    };
    if (!this._warpvasBoundary) {
      this._warpvasBoundary = _warpvasBoundary;
      this._warpvasScaleX = (this.targetCanvas!.width / warpvasCanvas.width) * this.warpvas.scale.x;
      this._warpvasScaleY =
        (this.targetCanvas!.height / warpvasCanvas.height) * this.warpvas.scale.y;
    }

    const relativeOffset = this._warpvasBoundary
      ? {
          x:
            (_warpvasBoundary.right + _warpvasBoundary.left) / 2 -
            (this._warpvasBoundary.right + this._warpvasBoundary.left) / 2,
          y:
            (_warpvasBoundary.bottom + _warpvasBoundary.top) / 2 -
            (this._warpvasBoundary.bottom + this._warpvasBoundary.top) / 2,
        }
      : { x: 0, y: 0 };
    const offset = fabric.util.transformPoint(
      new fabric.Point(
        relativeOffset.x * this._warpvasScaleX,
        relativeOffset.y * this._warpvasScaleY,
      ),
      object.calcOwnMatrix(),
      true,
    );

    const centerCoord = object.getCenterPoint();

    const fabricObjectOptions = {
      left: centerCoord.x + offset.x,
      top: centerCoord.y + offset.y,
      angle: object.angle,
      scaleX: object.scaleX! * this._warpvasScaleX,
      scaleY: object.scaleY! * this._warpvasScaleY,
      flipX: object.flipX,
      flipY: object.flipY,
      originX: 'center',
      originY: 'center',
    };

    grip.set(fabricObjectOptions);

    // 销毁网格成组关系，才能使路径直接相对画布布局
    grip.destroy();

    const warpvasObjectOptions = {
      ...fabricObjectOptions,
      opacity: object.opacity,
      globalCompositeOperation: object.globalCompositeOperation,
      scaleX: fabricObjectOptions.scaleX / (warpvasCanvas.width / gridWidth),
      scaleY: fabricObjectOptions.scaleY / (warpvasCanvas.height / gridHeight),
      selectable: false,
    };
    let warpvasObject = this.warpvasObject;
    if (warpvasObject) {
      warpvasObject.setElement(warpvasCanvas as any, warpvasObjectOptions);
    } else {
      warpvasObject = new fabric.Image(warpvasCanvas, warpvasObjectOptions);
    }

    this.warpvasObject = warpvasObject;
    this.paths = paths;
    this.pathCurveMap = pathCurveMap;
    this.curvePathMap = curvePathMap;

    // 执行渲染回调
    this._renderReturnCallback = this.mode?.render(this);
    if (dirty) {
      this._dirtyRenderReturnCallback = this.mode?.dirtyRender(this);
    }
    canvas.renderOnAddRemove = true;
    canvas.requestRenderAll();
  }

  /**
   * 跟随浏览器绘制时机进行变形效果渲染
   *
   * 使用 requestAnimationFrame 延迟渲染到下一帧，可以：
   * 1. 避免短时间内的重复渲染
   * 2. 优化连续变形时的性能
   * 3. 保持画面流畅度
   *
   * @param [dirty=true] - 是否为脏渲染，脏渲染会导致 _dirtyRenderReturnCallback 回调执行
   * @param [callback] - 渲染完成后的回调函数
   * @param [options] - 渲染配置选项
   * @param [options.skipHistoryRecording=false] - 是否跳过记录此次渲染的变形状态
   *
   * @example
   * ```typescript
   * // 基础用法
   * fabricWarpvas.requestRender();
   *
   * // 带回调的用法，可保证渲染完成后再执行其他逻辑
   * fabricWarpvas.requestRender(true, () => {
   *   console.log('渲染完成');
   * });
   *
   * // 连续变形时的优化用法
   * function onDragging() {
   *   fabricWarpvas.requestRender(false, null, {
   *     skipHistoryRecording: true // 拖拽过程中不记录历史
   *   });
   * }
   *
   * function onDragEnd() {
   *   fabricWarpvas.render(true); // 拖拽结束时记录一次历史
   * }
   * ```
   *
   * @remarks
   * 1. 此方法会自动取消上一次尚未执行的渲染请求
   * 2. 适合用于处理连续的变形操作，如拖拽控制点
   * 3. 对于关键状态的保存，建议使用同步的 render 方法
   *
   * @see render 同步渲染方法
   */
  requestRender(dirty = true, callback?: () => void, options: Partial<RenderOptions> = {}) {
    if (this._nextFrameRender) {
      window.cancelAnimationFrame(this._nextFrameRender);
    }
    this._nextFrameRender = window.requestAnimationFrame(() => {
      this.render(dirty, options);
      if (callback) callback();
      this._nextFrameRender = undefined;
    });
  }

  /**
   * 获取当前的变形模式
   *
   * @returns
   * - 如果当前不在变形状态，返回 null
   * - 否则返回当前变形模式类实例
   */
  getMode<T extends AbstractMode = AbstractMode>() {
    return this.mode as T | null;
  }

  /**
   * 提取当前变形状中的变形数据
   *
   * @returns
   * - 如果当前不在变形状态，返回 null
   * - 否则返回变形数据
   */
  getWarpState(): WarpState | null {
    const warpvas = this.warpvas;
    if (!warpvas) return null;

    // 提取变换数据
    return warpvas.getWarpState();
  }

  /**
   * 进入变形模式
   *
   * 使指定的 Fabric 对象进入变形变形状态，该操作会克隆目标对象，并默认使用该克隆对象的画布图像作为变形源图像。
   *
   * @param target - 目标变形 Fabric 对象（如图片、文本等）
   * @param sourceCanvas - 可选的源画布，用于特殊渲染需求，如果为 null，将使用 target 克隆对象的图像画布。
   * @param mode - 变形模式实例，决定了变形的交互方式和效果
   * @param beforeFirstRender - 首次渲染前的回调函数，可用于初始化变形引擎的配置
   *
   * @remarks
   * sourceCanvas 用于指定变形中应用的图像画布，它支持你使用目标元素的偏移等配置的同时使用另一张图像进行变形，
   * 如果元素已经经过一次变形，此刻再进入变形，默认图像将是错误的，你需要传入未变形画布作为参数，否则将不会达到预期。
   *
   * @example
   * ```typescript
   * fabricWarpvas.enterEditing(
   *   target,
   *   null,
   *   new Wrap(),
   *   (warpvas) => {
   *     // 设置显示分割网格线
   *     warpvas.setRenderingConfig({ enableGridDisplay: true });
   *   }
   * );
   * ```
   *
   * @see leaveEditing 退出变形模式
   */
  enterEditing(
    target: fabric.Object,
    sourceCanvas: HTMLCanvasElement | null,
    mode: AbstractMode,
    beforeFirstRender?: (warpvas: Warpvas) => void,
  ) {
    if (!this.canvas) return;
    if (this.target) {
      throw Error(
        '[Fabric-Warpvas] You must complete the previous deformation state before entering a new one.',
      );
    }

    this.target = target;

    this.mode = mode;
    this.canvas.discardActiveObject();

    // 临时还原配置以获取无变换形态下的元素图像
    const { opacity, visible, angle, flipX, flipY, scaleX, scaleY } = this.target.toJSON() as any;
    this.target.set({
      opacity: 1,
      visible: true,
      angle: 0,
      scaleX: 1,
      scaleY: 1,
      flipX: false,
      flipY: false,
    });
    this.targetCanvas = this.target.toCanvasElement();
    // 恢复配置
    this.target.set({ opacity, visible, angle, flipX, flipY, scaleX, scaleY });

    const canvas = sourceCanvas ?? this.targetCanvas;

    const warpvas = new Warpvas(canvas);
    warpvas
      .setInputLimitSize({ width: 2000, height: 2000 })
      .setRenderingCanvas(document.createElement('canvas'))
      .setSplitStrategy({
        name: this.mode.name,
        execute: this.mode.execute.bind(this.mode),
      });
    this.warpvas = warpvas;

    // 首次渲染前执行回调
    beforeFirstRender?.(warpvas);

    // 渲染图像元素
    this.render();
  }

  /**
   * 退出变形模式
   *
   * @example
   * ```typescript
   * // 完成编辑后退出
   * fabricWarpvas.leaveEditing();
   *
   * // 完整的变形流程
   * try {
   *   // 1. 进入变形状态
   *   fabricWarpvas.enterEditing(target, null, new Warp());
   *
   *   // 2. 进行变形操作...
   *
   *   // 3. 保存变形数据
   *   const result = fabricWarpvas.getWarpState();
   *
   *   // 4. 退出变形模式
   *   fabricWarpvas.leaveEditing();
   * } catch (error) {
   *   console.error('变形过程出错:', error);
   *   fabricWarpvas.leaveEditing(); // 确保清理资源
   * }
   * ```
   *
   * @see enterEditing 进入变形模式
   */
  leaveEditing() {
    if (!this.target) return;

    const canvas = this.canvas;
    if (!canvas) return;

    // 执行销毁回调
    canvas.renderOnAddRemove = false;
    if (this._dirtyRenderReturnCallback) {
      this._dirtyRenderReturnCallback();
      this._dirtyRenderReturnCallback = undefined;
    }
    if (this._renderReturnCallback) {
      this._renderReturnCallback();
      this._renderReturnCallback = undefined;
    }
    canvas.renderOnAddRemove = true;
    canvas.requestRenderAll();

    // 释放内存
    this.mode = null;
    this.target = null;
    this.warpvas = null;
    this.warpvasObject = undefined;
    this.paths = undefined;
    this.pathCurveMap = new WeakMap();
    this.curvePathMap = new WeakMap();

    this._warpvasBoundary = undefined;
    this._warpvasScaleX = 1;
    this._warpvasScaleY = 1;
    this._records.undo.length = 0;
    this._records.redo.length = 0;
  }

  /**
   * 记录当前变形状态
   *
   * 将当前的变形状态保存到历史记录中。
   *
   * @remarks
   * 1. 仅在启用了历史记录功能时生效（options.enableHistory = true）
   * 2. 每次记录都会创建状态的深拷贝，注意内存占用
   *
   * @see undo 撤销操作
   * @see redo 重做操作
   */
  record() {
    if (!this.warpvas) return;
    if (this.options.enableHistory) {
      this._records.redo.length = 0;
      this._records.undo.push(cloneDeep(this.warpvas.getWarpState()));
      this.options.onHistoryChange(this._records);
    }
  }

  /**
   * 撤销上一步变形操作
   *
   * 将变形状态回退到上一个记录点。
   *
   * @example
   * ```typescript
   * // 基础用法
   * fabricWarpvas.undo();
   *
   * // 配合快捷键使用
   * document.addEventListener('keydown', (e) => {
   *   if (e.ctrlKey && e.key === 'z') {
   *     fabricWarpvas.undo();
   *   }
   * });
   * ```
   *
   * @remarks
   * 1. 如果撤销栈为空或只有初始状态，此操作无效
   * 2. 撤销操作本身不会产生新的历史记录
   *
   * @see redo 重做已撤销的操作
   */
  undo() {
    if (!this.warpvas) return;
    const size = this._records.undo.length;
    if (size <= 1) return;
    this._records.redo.unshift(this._records.undo.pop()!);
    const record = this._records.undo[size - 2];
    this.warpvas.setWarpState(record.splitPoints, record.regionBounds);
    this.render(true, { skipHistoryRecording: true });
    this.options.onHistoryChange(this._records);
  }

  /**
   * 重做已撤销的变形操作
   *
   * 重新应用之前撤销的变形状态。
   *
   * @example
   * ```typescript
   * // 基础用法
   * fabricWarpvas.redo();
   *
   * // 配合快捷键使用
   * document.addEventListener('keydown', (e) => {
   *   if (e.ctrlKey && e.key === 'y') {
   *     fabricWarpvas.redo();
   *   }
   * });
   * ```
   *
   * @remarks
   * 1. 如果重做栈为空，此操作无效
   * 2. 重做操作本身不会产生新的历史记录
   * 3. 执行新的变形操作会清空重做栈
   *
   * @see undo 撤销操作
   */
  redo() {
    if (!this.warpvas) return;
    const record = this._records.redo.shift();
    if (record) {
      this._records.undo.push(record);
      this.warpvas.setWarpState(record.splitPoints, record.regionBounds);
      this.render(true, { skipHistoryRecording: true });
      this.options.onHistoryChange(this._records);
    }
  }

  /**
   * 重置变形状态
   *
   * 将图像重置到指定状态：
   * - 当 keepHistory=true 时：清除所有变形效果，但保留变形记录
   * - 当 keepHistory=false 时：回退到初始状态，清空变形记录
   *
   * @param keepHistory - 是否保留历史记录
   *   - true: 清除变形但保留历史，可回到上一步状态
   *   - false: 回退到初始状态，并清空变形记录
   *
   * @example
   * ```typescript
   * // 1. 清除变形但保留历史记录
   * fabricWarpvas.reset(true);
   *
   * // 2. 回退到初始状态，并清空变形记录
   * fabricWarpvas.reset(false);
   * ```
   *
   * @remarks
   * 在以下情况下方法无效：
   *  - 当前不在变形状态（warpvas 为 null）
   *  - 当前已经是初始状态（keepHistory=true 时）
   *
   * @see undo 单步撤销操作
   * @see redo 重做已撤销的操作
   * @see serialize 保存当前变形状态
   */
  reset(keepHistory = true) {
    const warpvas = this.warpvas;
    if (!warpvas) return;
    if (keepHistory) {
      if (warpvas.isUnwarped()) return;
      warpvas.resetWarpState();
      this.render(true);
    } else {
      this._records.redo.length = 0;
      this._records.undo.length = 1;
      const record = this._records.undo[0];
      if (record) {
        warpvas.setWarpState(record.splitPoints, record.regionBounds);
        this.render(true, { skipHistoryRecording: true });
      }
      this.options.onHistoryChange(this._records);
    }
  }
}
