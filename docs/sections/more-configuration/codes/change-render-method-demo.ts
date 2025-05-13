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
warpvas
  ?.setRenderingConfig({
    enableAntialias: /*-antialias-*/ false /**/, // 是否应用抗锯齿
  })
  /*-canvas-render-*/ .setRenderingContext('2d') /**/
  /*-webgl-render-*/ .setRenderingContext('webgl'); /**/
/*---*/
