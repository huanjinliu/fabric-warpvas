import type { FabricImage, FabricObject, Path } from 'fabric';
import type { Bezier } from 'bezier-js';
import { Warpvas } from 'warpvas';
import defaults from 'lodash-es/defaults';
import type { FabricWarpvas } from '../fabric-warpvas.class';
import { AbstractMode } from '../abstract-mode.class';

/**
 * 默认主题色
 *
 * 决定交互控件的颜色
 *
 * @default '#33333399' 半透明深灰
 */
export const THEME_COLOR = '#33333399';

/**
 * 默认副主题色
 *
 * 决定交互控件交互时的变化色，应与主题色形成合适的搭配
 *
 * @default '#333333ff' 深灰
 */
export const SUB_THEME_COLOR = '#333333ff';

/**
 * 交互元素的样式配置器类型
 *
 * 用于自定义变形模式中各种交互元素的样式。
 *
 * @template T - 扩展的样式设置器类型，默认为空的对象方法映射
 */
export type BaseStyleSetters<T = Record<string, (...rgs: any[]) => FabricObject>> = T & {
  /**
   * 配置变形后贴图的样式
   *
   * @param image - fabric.Image 实例，代表变形对象，无论是什么 Fabric 对象，在进入变形后操作对象都是 fabric.Image 实例
   */
  image: (image: FabricImage) => void;

  /**
   * 配置网格边界线的样式
   *
   * @param path - fabric.Path 实例，代表网格的边界线
   */
  path: (path: Path) => void;
};

/**
 * 模式配置
 */
export type BaseOptions<T> = T & {
  /**
   * 主题色
   *
   * 决定交互控件的颜色
   *
   * @default THEME_COLOR ('#33333399')
   */
  themeColor?: string;
  /**
   * 副主题色
   *
   * 决定交互控件交互时的变化色，应与主题色形成合适的搭配
   *
   * @default SUB_THEME_COLOR ('#333333ff')
   */
  subThemeColor?: string;
};

/**
 * 变形模式的基础实现类
 *
 * 提供了变形模式的基础功能实现，包括：
 * - 配置默认的变形分割策略，即扭曲策略
 * - 基础主题色管理
 * - 基础渲染逻辑，在进入变形时显示变形贴图和边界线
 *
 * @template Objects - 扩展的样式设置器类型，用于添加自定义的样式配置方法以支持对自定义变形模式内部的元素样式添加配置
 *
 * @remarks
 * 1. 这是一个用作其他内置变形模式的基类，而不直接使用
 * 2. 可以通过继承此类来创建自定义的变形模式
 */
class BaseMode<Objects, Options> extends AbstractMode {
  /**
   * 变形模式的唯一标识名称
   *
   * 用于在分割策略中标识当前模式，为自定义标识，每个模式都应该有唯一的名称
   *
   * @remarks 该模式基类不对外开放
   */
  public name = '__base__';

  /**
   * 模式配置
   */
  public options = {
    themeColor: THEME_COLOR,
    subThemeColor: SUB_THEME_COLOR,
  } as BaseOptions<Options>;

  /**
   * 样式设置器集合
   *
   * 用于自定义变形模式中各种元素的样式，包括：
   * - image: 变形后的贴图样式
   * - path: 网格边界线的样式
   * - 其他通过泛型 T 扩展的自定义样式设置器
   *
   * @protected 仅供子类访问和修改
   *
   * @see registerStyleSetter 了解如何通过 API 设置自定义样式
   */
  protected _styleSetters = {
    image: () => {},
    path: () => {},
  } as BaseStyleSetters<Objects>;

  /**
   * 创建变形模式实例
   *
   * 初始化一个基础变形模式，可以通过参数自定义主题色系。
   */
  constructor(options: Partial<BaseOptions<Options>> = {}) {
    super();

    this.options = defaults(options, this.options);
  }

  /**
   * 注册样式设置器，自定义变形模式中各种元素的外观，如果模式类并未对外提供设置入口，那便意味无法实现自定义修改
   *
   * @param label - 样式设置器的标签，用于标识要设置的元素
   * @param setter - 样式设置器的回调函数，用于设置元素的样式
   *
   * @template K - 样式设置器的标签类型，必须是 T 中定义的键之一
   *
   * @example
   * ```typescript
   * // 进入变形模式的图像样式设置 80% 不透明度
   * mode.registerStyleSetter('image', (image) => {
   *   image.set({ opacity: 0.8 });
   * });
   * ```
   *
   * @remarks
   * 1. 新的样式设置会与现有设置合并，而不是完全替换
   * 2. 对于同名设置器，新的会覆盖旧的
   * 3. 样式会在下一次渲染时生效
   */
  registerStyleSetter<K extends keyof Objects>(label: K, setter: Objects[K]) {
    this._styleSetters = defaults(
      {
        [label]: setter,
      },
      this._styleSetters,
    );
  }

  /**
   * 执行变形分割策略
   *
   * 基类中返回空数组，需要在子类中实现具体的分割逻辑。
   *
   * @param warpvas - 画布变形工具实例
   * @returns 返回三维数组，表示网格的分割点坐标：
   * - 第一维：行
   * - 第二维：列
   * - 第三维：分割点坐标
   *
   * @virtual 此方法应在子类中重写
   */
  execute(warpvas: Warpvas): Coord[][][] {
    return Warpvas.strategy(warpvas);
  }

  /**
   * 渲染变形效果到画布
   *
   * 将变形后的贴图和网格边界线渲染到 Fabric.js 画布上。
   *
   * @param fabricWarpvas - Fabric 变形工具实例，包含画布和变形状态
   * @returns 清理函数，用于移除渲染的元素
   *
   * @example
   * ```typescript
   * class CustomMode extends BaseMode {
   *   render(fabricWarpvas: FabricWarpvas) {
   *     // 调用基类渲染方法
   *     const cleanup = super.render(fabricWarpvas);
   *
   *     // 添加自定义渲染逻辑
   *     const customElements = this.renderCustomElements();
   *
   *     // 返回组合的清理函数
   *     return () => {
   *       cleanup();
   *       this.cleanupCustomElements(customElements);
   *     };
   *   }
   * }
   * ```
   *
   * @remarks
   * 1. 返回的清理函数会在下次渲染前或离开编辑模式时自动调用
   * 2. 子类可以通过 super.render() 复用基类的渲染逻辑
   * 3. 渲染的元素样式可通过 registerStyleSetters 配置
   */
  render(fabricWarpvas: FabricWarpvas) {
    const fabricCanvas = fabricWarpvas.canvas;
    if (!fabricCanvas) return;

    const { warpvas, warpvasObject, paths = [], curvePathMap } = fabricWarpvas;
    if (!warpvasObject || !warpvas) return;

    // 配置变形图像样式并添加到画布上
    this._styleSetters.image(warpvasObject);
    fabricCanvas.add(warpvasObject);

    // 添加网格路径对象列表
    if (paths?.length) fabricCanvas.add(...paths);

    // 调整路径样式，移除中间路径
    const setStyle = (list: Bezier[]) => {
      list.forEach((curve, index, arr) => {
        const path = curvePathMap.get(curve);
        if (!path) return;
        if (index === 0 || index === arr.length - 1) {
          const originCenterPoint = path.getCenterPoint();
          path.set({
            stroke: this.options.themeColor,
            strokeWidth: 1,
            strokeUniform: true,
            fill: 'transparent',
            selectable: false,
            evented: false,
            originX: 'center',
            originY: 'center',
          });
          this._styleSetters.path(path);
          // 重置回原路径中心，避免轮廓宽度使路径发生偏移
          path.setPositionByOrigin(originCenterPoint, 'center', 'center');
        } else {
          // 移除中间不可视路径
          fabricCanvas.remove(path);
        }
      });
    };
    warpvas?.regionCurves.forEach((row) => {
      row.forEach((col) => {
        const { horizontal, vertical } = col;
        setStyle(horizontal);
        setStyle(vertical);
      });
    });

    return () => {
      const { warpvasObject, paths = [] } = fabricWarpvas;
      // 移除旧贴图
      if (warpvasObject) fabricCanvas.remove(warpvasObject);
      // 移除旧路径元素
      if (paths.length) fabricCanvas.remove(...paths);
    };
  }
}

export default BaseMode;
