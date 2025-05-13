import { Canvas, FabricImage } from 'fabric/es';
import { FabricWarpvas } from 'fabric-warpvas';
import Warp from 'fabric-warpvas/modes/warp';
import Perspective from 'fabric-warpvas/modes/perspective';

// 创建 fabric 画布对象
const canvas = document.createElement('canvas');
const fabricCanvas = new Canvas(canvas);

// 创建 fabricWarpvas 对象并传入画布作为变形编辑器的载体
const fabricWarpvas = new FabricWarpvas(fabricCanvas);

// 目标对象进入变形态
fabricWarpvas.enterEditing(
  new FabricImage(/*-upload-image-*/ new Image() /**/),
  null, // 图像画布，默认使用目标元素自身
  new /*-mode-*/ Warp /**/(), // 变形模式
);
