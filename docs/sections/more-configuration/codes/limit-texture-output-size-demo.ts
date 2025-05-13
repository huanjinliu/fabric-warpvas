import { FabricWarpvas } from 'fabric-warpvas';
import { Canvas, FabricImage } from 'fabric/es';
import Perspective from 'fabric-warpvas/modes/perspective';

const canvas = document.createElement('canvas');
const fabricCanvas = new Canvas(canvas);
const fabricWarpvas = new FabricWarpvas(fabricCanvas);

// 进入透视变形
/*---*/
fabricWarpvas.enterEditing(new FabricImage(
  new Image()),
  null,
  new Perspective(),
  (warpvas) => {
    // 当尺寸限制太大/或无限制，当产出图过大且超出浏览器限制，将绘制失败并返回空白图
    // 当尺寸限制太小，则会导致产出图尺寸过小，导致图像模糊
    // 请进行合理的配置
    warpvas.setOutputLimitSize({
      width: /*-output-width-*/ 1000 /**/,
      height: /*-output-height-*/ 1000 /**/,
    });
  },
);
/*---*/
