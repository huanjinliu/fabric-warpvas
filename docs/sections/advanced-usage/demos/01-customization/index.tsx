import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { FabricImage } from 'fabric/es';
import { FabricWarpvas, AbstractMode } from 'fabric-warpvas';
import type { Warpvas } from 'Warpvas';
import { utils } from 'Warpvas';
import Warp from 'fabric-warpvas/modes/warp';
import { Canvas } from 'docs/components';
import type { CanvasHandlers } from 'docs/components/canvas';
import { DocsContext } from 'docs/docs';
import styles from './style.less';
import { calcFabricCanvasCoord, calcFabricRelativeCoord } from '@utils';
const { calcCoordDistance, calcRelativeCoord } = utils;

export class ConvexMode extends AbstractMode {
  name = 'convex';

  convexCenterPoint: Coord | null = null;

  constructor(
    public radius: number,
    public level: number,
  ) {
    super();
  }

  execute(warpvas: Warpvas) {
    const points = Warp.execute(warpvas);
    const centerPoint = this.convexCenterPoint;
    if (!centerPoint) return points;
    return points.map((rows) =>
      rows.map((row) =>
        row.map((point) => {
          const distance = calcCoordDistance(centerPoint, point);
          if (distance <= this.radius) {
            return calcRelativeCoord(
              centerPoint,
              point,
              this.radius - this.radius * (1 - distance / this.radius) ** Math.max(0, this.level),
            );
          } else {
            return point;
          }
        }),
      ),
    );
  }

  dirtyRender(fabricWarpvas: FabricWarpvas) {
    const fabricCanvas = fabricWarpvas.canvas;
    if (!fabricCanvas) return;

    fabricCanvas.on('mouse:move', (e) => {
      if (!e.viewportPoint) return;
      const pointer = calcFabricCanvasCoord(fabricCanvas, e.viewportPoint);

      const path = fabricWarpvas.paths?.[0];
      if (!path) return;

      const coord = calcFabricRelativeCoord({ left: pointer.x, top: pointer.y }, path);
      this.convexCenterPoint = coord;

      fabricWarpvas.requestRender(false);
    });
  }
}

const Customization = () => {
  const { placeholder } = useContext(DocsContext);

  const _canvasRef = useRef<CanvasHandlers>(null);
  const _fabricWarpvasRef = useRef<FabricWarpvas>();

  const render = useCallback(async () => {
    const canvas = _canvasRef.current?.getCanvas();
    if (!canvas) return;

    const width = canvas.getWidth();
    const height = canvas.getHeight();

    if (!placeholder) return;

    // 限制画布不允许多选
    canvas.selection = false;

    // 缩放以控制在合理渲染区域内
    const scale =
      Math.min(200, canvas.getWidth()) /
      Math.min(placeholder.naturalWidth, placeholder.naturalHeight);

    // 创建元素
    const object = new FabricImage(placeholder, {
      left: width / 2,
      top: height / 2,
      scaleX: scale,
      scaleY: scale,
      originX: 'center',
      originY: 'center',
    });

    // 进入交互态
    const fabricWarpvas = new FabricWarpvas(canvas);
    fabricWarpvas.enterEditing(
      object,
      null,
      new ConvexMode(Math.ceil(placeholder.naturalWidth / 3), 3),
    );
    if (_fabricWarpvasRef.current) {
      _fabricWarpvasRef.current.leaveEditing();
    }
    _fabricWarpvasRef.current = fabricWarpvas;

    fabricWarpvas.warpvas
      ?.setSplitUnit(0.02)
      .setInputLimitSize({ width: 2000, height: 2000 })
      .setOutputLimitSize({ width: 2000, height: 2000 })
      .setRenderingCanvas(document.createElement('canvas'))
      .setRenderingConfig({ padding: 60 });
    fabricWarpvas.render();

    // 隐藏源元素
    object.set({ visible: false });
    canvas.renderAll();
  }, [placeholder]);

  useEffect(() => {
    render();
  }, [render]);

  return (
    <div className={styles.demo}>
      <Canvas className={styles.canvas} ref={_canvasRef} />
      <div className={styles.hint}>请移动鼠标到图案上</div>
    </div>
  );
};

export default Customization;
