import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { FabricWarpvas, AbstractMode } from 'fabric-warpvas';
import type { Warpvas } from 'Warpvas';
import { utils } from 'Warpvas';
import Warp from 'fabric-warpvas/modes/warp';
import { Canvas, Code, TextSlider, TextSwitch } from 'docs/components';
import type { CanvasHandlers } from 'docs/components/canvas';
import { DocsContext } from 'docs/docs';
import { calcFabricCanvasCoord, calcFabricRelativeCoord } from '@utils';
import styles from './style.less';

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
              this.radius -
                this.radius * (1 - distance / this.radius) ** Math.max(0, this.level + 1),
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
      if (!e.pointer) return;
      const pointer = calcFabricCanvasCoord(fabricCanvas, e.pointer);

      const path = fabricWarpvas.paths?.[0];
      if (!path) return;

      const coord = calcFabricRelativeCoord({ left: pointer.x, top: pointer.y }, path);
      this.convexCenterPoint = coord;

      fabricWarpvas.requestRender(false);
    });
  }
}

const ApplyConvetMode = () => {
  const { placeholder } = useContext(DocsContext);

  const _canvasRef = useRef<CanvasHandlers>(null);
  const _fabricWarpvasRef = useRef<FabricWarpvas>();

  const [radius, setRadius] = useState<number>(100);
  const [level, setLevel] = useState<number>(2);
  const [padding, setPadding] = useState<number>(0);
  const [showGridDot, setShowGridDot] = useState<boolean>(true);

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
    const object = new fabric.Image(placeholder, {
      left: width / 2,
      top: height / 2,
      scaleX: scale,
      scaleY: scale,
      originX: 'center',
      originY: 'center',
    });

    // 如果之前已经进入则退出
    if (_fabricWarpvasRef.current) {
      _fabricWarpvasRef.current.leaveEditing();
    }

    // 进入交互态
    const fabricWarpvas = new FabricWarpvas(canvas);
    fabricWarpvas.enterEditing(object, null, new ConvexMode(radius, level), (texture) => {
      texture
        .setSplitUnit(0.02)
        .setInputLimitSize({ width: 2000, height: 2000 })
        .setOutputLimitSize({ width: 2000, height: 2000 })
        .setRenderingCanvas(document.createElement('canvas'))
        .setRenderingConfig({ padding, enableGridDisplay: showGridDot });
    });
    _fabricWarpvasRef.current = fabricWarpvas;

    // 隐藏源元素
    object.set({ visible: false });
    canvas.renderAll();
  }, [placeholder, radius, level, padding, showGridDot]);

  useEffect(() => {
    render();
  }, [render]);

  return (
    <div className={styles.demo}>
      <Canvas className={styles.canvas} ref={_canvasRef} />
      <Code className={styles.code} link={'./sections/advanced-usage/codes/realize-convex-mode.ts'}>
        {(key) => {
          switch (key) {
            case 'import-url':
              return <span className="hljs-string">'convex-mode.class.ts'</span>;
            case 'radius':
              return (
                <TextSlider value={radius} step={10} min={50} max={200} onChange={setRadius} />
              );
            case 'level':
              return <TextSlider value={level} step={1} min={1} max={10} onChange={setLevel} />;
            case 'padding':
              return (
                <TextSlider value={padding} step={10} min={0} max={100} onChange={setPadding} />
              );
            case 'show-grid-dot':
              return <TextSwitch value={showGridDot} onChange={setShowGridDot} />;
          }
        }}
      </Code>
    </div>
  );
};

export default ApplyConvetMode;
