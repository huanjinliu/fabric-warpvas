import type { FabricWarpvas } from './fabric-warpvas.class';
import { Warpvas } from 'warpvas';

/**
 * 变形模式的抽象基类
 *
 * 可具体实现该基类实现自定义变形模式
 *
 * @example
 * ```typescript
 * // 实现一个自定义变形模式类
 * class CustomMode extends AbstractMode {
 *   // 第一步：自定义模式名称
 *   name = 'custom-mode';
 *
 *   // 第二步：自定模式下的分割点计算策略，如果不覆盖默认的扭曲策略，可直接调用 super.execute 方法
 *   execute(warpvas: Warpvas) {
 *     return super.execute(warpvas);
 *   }
 *
 *   // 第三步：覆盖默认的渲染时机钩子，该渲染方法会在 fabricWarpvas.render 执行后执行
 *   render(fabricWarpvas: FabricWarpvas) {
 *     // 这里保留默认逻辑（将临时变形图像添加到画布上）
 *     const cleanup = super.render(fabricWarpvas);
 *
 *     // 添加自定义的交互元素，比如四个对角的交互点
 *     const customElement = new fabric.Rect({ ... });
 *     fabricWarpvas.canvas.add(customElement);
 *
 *     // 返回清理回调
 *     return () => {
 *       // 移除添加的自定义交互元素
 *       fabricWarpvas.canvas.remove(customElement);
 *       // 执行默认逻辑的回调函数（移除临时变形图像）
 *       cleanup?.();
 *     };
 *   }
 *
 *   // 第四步：具体实现脏渲染时机钩子，脏渲染逻辑仅在 fabricWarpvas.render 执行且 dirty 参数为 true 时执行
 *   dirtyRender() {
 *     // 返回清理回调
 *     return () => {};
 *   }
 * }
 * ```
 */
export abstract class AbstractMode {
  /**
   * 变形模式的标识名称，建议使用唯一标识，比如 'custom-mode'
   */
  abstract name: string;

  /**
   * 该模式计算变形区域分割点位置的策略方法，默认使用 warpvas 库的扭曲计算策略。
   *
   * @param warpvas - Warpvas 实例对象
   * @returns 返回计算后的分割点坐标数组
   *
   * @see Warpvas 了解 warpvas.js 库
   */
  execute(warpvas: Warpvas) {
    return Warpvas.strategy(warpvas);
  }

  /**
   * 在 fabricWarpvas.render 执行后执行的钩子函数
   *
   * @param fabricWarpvas - FabricWarpvas 实例对象
   * @returns 返回清理回调函数，在下一次 fabricWarpvas.render 执行前执行
   */
  render(fabricWarpvas: FabricWarpvas): (() => void) | void {
    const fabricCanvas = fabricWarpvas.canvas;
    if (!fabricCanvas) return;

    // 默认添加变形图像进画布
    const { warpvasObject } = fabricWarpvas;
    if (warpvasObject) fabricCanvas.add(warpvasObject);

    return () => {
      if (warpvasObject) fabricCanvas.remove(warpvasObject);
    };
  }

  /**
   * 在 fabricWarpvas.render 执行且 dirty 参数为 true 时执行的钩子函数
   *
   * 当变形区域结构发生变化时，dirty 参数为 true，但该参数也可由外部手动触发 render 传入
   *
   * @param fabricWarpvas - FabricWarpvas 实例
   * @returns 返回清理回调函数，在下一次 fabricWarpvas.render 执行前执行
   */
  dirtyRender(fabricWarpvas: FabricWarpvas): (() => void) | void {
    return;
  }
}
