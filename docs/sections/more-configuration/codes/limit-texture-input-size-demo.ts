import { FabricWarpvas } from 'fabric-warpvas';
import { fabric } from 'fabric';
import Perspective from 'fabric-warpvas/modes/perspective';

const canvas = document.createElement('canvas');
const fabricCanvas = new fabric.Canvas(canvas);
const fabricWarpvas = new FabricWarpvas(fabricCanvas);

// 进入透视变形
/*---*/
fabricWarpvas.enterEditing(new fabric.Image(new Image()), null, new Perspective(), (warpvas) => {
  // 设置输入画布的尺寸限制，过大的原图对象会缩放至该尺寸范围内
  // 适当地限制可以实现保证质量的同时减少交互延时（图像合成造成的页面阻塞）
  // 请避免设置过小限制，这会导致变形图变得模糊
  warpvas.setInputLimitSize({
    width: /*-input-width-*/ 2000 /**/,
    height: /*-input-height-*/ 2000 /**/,
  });
});
/*---*/
