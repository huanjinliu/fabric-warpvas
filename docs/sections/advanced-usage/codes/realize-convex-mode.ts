import { Canvas, FabricImage } from 'fabric/es';
import { FabricWarpvas } from 'fabric-warpvas';
import { ConvexMode } from /*-import-url-*/ '../demos/01-customization' /**/;

// 创建交互画布，此处简化了代码
const canvas = new Canvas(document.createElement('canvas'));

// 创建元素，此处简化了代码
const object = new FabricImage(new Image());

// 进入交互态
/*---*/
const fabricWarpvas = new FabricWarpvas(canvas);
fabricWarpvas.enterEditing(
  object,
  null,
  // 应用凸面交互模式
  new ConvexMode(
    /*-radius-*/ 100 /**/, // 凸面半径
    /*-level-*/ 3 /**/, // 凸面程度
  ),
  (texture) => {
    texture.setRenderingConfig({
      padding: /*-padding-*/ 60 /**/, // 四周留白区域
      enableGridDisplay: /*-show-grid-dot-*/ true /**/,
    });
  },
);
/*---*/
