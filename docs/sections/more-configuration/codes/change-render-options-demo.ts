import { FabricWarpvas } from 'fabric-warpvas';
import { Canvas, FabricImage } from 'fabric/es';
import Warp from 'fabric-warpvas/modes/warp';

const canvas = document.createElement('canvas');
const fabricCanvas = new Canvas(canvas);
const fabricWarpvas = new FabricWarpvas(fabricCanvas);

/*---*/
// 进入扭曲变形
fabricWarpvas.enterEditing(
  new FabricImage(new Image()),
  null,
  new Warp(),
  // 在回调中进行初始化配置
  (warpvas) => {
    warpvas.setRenderingConfig({
      enableGridDisplay: /*-show-grid-*/ false /**/, // 是否显示分割线
      enableGridVertexDisplay: /*-show-grid-dot-*/ false /**/, // 是否显示分割点
      enableContentDisplay: /*-show-texture-*/ false /**/, // 是否显示图像
    });
  },
);
// 当然也支持在回调外动态配置，不过需要手动触发渲染更新
// fabricWarpvas.warpvas?.setRenderingConfig({ ... })
// fabricWarpvas.requestRender()
/*---*/
