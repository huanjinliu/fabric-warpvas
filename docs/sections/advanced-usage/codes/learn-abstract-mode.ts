import { FabricWarpvas, AbstractMode } from 'fabric-warpvas';
import type { Warpvas } from 'Warpvas';

class Mode extends AbstractMode {
  // 你定义的交互模式名称
  name = 'Your custom mode name';

  // 该方法定义该交互模式下变形时的分割点计算策略，默认使用 变形模式（WARP）同一计算策略
  execute(warpvas: Warpvas) {
    return super.execute(warpvas);
  }

  // 该方法定义你需要在每次变形图像生成成功后的处理逻辑，常用于添加图像对象到交互画布
  render(fabricWarpvas: FabricWarpvas) {}

  // 相比于 render 方法，该方法定义你只需在图像结构发生改变时才执行的逻辑，这不会在图像仅出现坐标点更新的情况下执行
  dirtyRender(fabricWarpvas: FabricWarpvas) {}
}

export default Mode;
