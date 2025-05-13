import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { FabricImage } from 'fabric/es';
import { FabricWarpvas } from 'fabric-warpvas';
import Warp from 'fabric-warpvas/modes/warp';
import { Canvas as XCanvas, Code, TextSwitch } from 'docs/components';
import type { CanvasHandlers } from 'docs/components/canvas';
import { DocsContext } from 'docs/docs';
import styles from './style.less';

const ChangeRenderOptions = () => {
  const { placeholder } = useContext(DocsContext);

  const _canvasRef = useRef<CanvasHandlers>(null);
  const _fabricWarpvasRef = useRef<FabricWarpvas>();

  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [showGridDot, setShowGridDot] = useState<boolean>(false);
  const [showContext, setShowContext] = useState<boolean>(true);

  const render = useCallback(async () => {
    const canvas = _canvasRef.current?.getCanvas();
    if (!canvas) return;

    const width = canvas.getWidth();
    const height = canvas.getHeight();

    if (!placeholder) return;
    const { naturalWidth, naturalHeight } = placeholder;

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

    // 如果已存在则先结束上一轮编辑
    if (_fabricWarpvasRef.current) {
      _fabricWarpvasRef.current.leaveEditing();
    }

    // 进入交互态
    const fabricWarpvas = new FabricWarpvas(canvas, { enableHistory: true });
    fabricWarpvas.enterEditing(object, null, new Warp(), (warpvas) => {
      warpvas
        .setSplitUnit(0.05)
        .setInputLimitSize({ width: 2000, height: 2000 })
        .setOutputLimitSize({ width: 2000, height: 2000 })
        .setRenderingConfig({
          enableGridDisplay: showGrid,
          enableGridVertexDisplay: showGridDot,
          enableContentDisplay: showContext,
        })
        .updateRegionBoundCoords(0, 0, 'top', [
          { x: 0, y: 0 },
          { x: naturalWidth / 3, y: naturalHeight * 0.2 },
          { x: naturalWidth * (2 / 3), y: naturalHeight * 0.2 },
          { x: naturalWidth, y: 0 },
        ])
        .updateRegionBoundCoords(0, 0, 'bottom', [
          { x: 0, y: naturalHeight },
          { x: naturalWidth / 3, y: naturalHeight * 0.8 },
          { x: naturalWidth * (2 / 3), y: naturalHeight * 0.8 },
          { x: naturalWidth, y: naturalHeight },
        ]);
    });
    _fabricWarpvasRef.current = fabricWarpvas;

    // 隐藏源元素
    object.set({ visible: false });
    canvas.renderAll();
  }, [placeholder]);

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    _fabricWarpvasRef.current?.warpvas?.setRenderingConfig({
      enableGridDisplay: showGrid,
      enableGridVertexDisplay: showGridDot,
      enableContentDisplay: showContext,
    });
    _fabricWarpvasRef.current?.requestRender();
  }, [showGrid, showGridDot, showContext]);

  return (
    <div className={styles.demo}>
      <XCanvas className={styles.canvas} ref={_canvasRef} />
      <Code
        className={styles.code}
        link="sections/more-configuration/codes/change-render-options-demo.ts"
      >
        {(key) => {
          switch (key) {
            case 'show-grid':
              return <TextSwitch value={showGrid} onChange={setShowGrid} />;
            case 'show-grid-dot':
              return <TextSwitch value={showGridDot} onChange={setShowGridDot} />;
            case 'show-texture':
              return <TextSwitch value={showContext} onChange={setShowContext} />;
          }
        }}
      </Code>
    </div>
  );
};

export default ChangeRenderOptions;
