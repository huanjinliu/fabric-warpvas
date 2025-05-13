import { FabricWarpvas } from 'fabric-warpvas';
import { Canvas, FabricImage } from 'fabric/es';
import Warp from 'fabric-warpvas/modes/warp';

const canvas = document.createElement('canvas');
const fabricCanvas = new Canvas(canvas);
const fabricWarpvas = new FabricWarpvas(fabricCanvas);

// 进入扭曲变形
fabricWarpvas.enterEditing(new FabricImage(new Image()), null, new Warp());

/*---*/
const warpvas = fabricWarpvas.warpvas;
if (warpvas) {
  warpvas
    .setSplitUnit(/*-unit-*/ 0.1 /**/)
    .setRenderingConfig({
      enableGridDisplay: /*-show-grid-*/ false /**/, // 是否显示分割线
    });
}
/*---*/
