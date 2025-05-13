import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { FabricImage } from 'fabric/es';
import { FabricWarpvas } from 'fabric-warpvas';
import Perspective from 'fabric-warpvas/modes/perspective';
import Warp from 'fabric-warpvas/modes/warp';
import { Canvas, Code, TextValue } from 'docs/components';
import type { CanvasHandlers } from 'docs/components/canvas';
import { DocsContext } from 'docs/docs';
import styles from './style.less';

const modes = {
  Perspective,
  Warp,
};

const LimitTextureInputSize = () => {
  const { placeholder } = useContext(DocsContext);

  const _canvasRef = useRef<CanvasHandlers>(null);
  const _fabricWarpvasRef = useRef<FabricWarpvas>();

  const [inputWidth, setInputWidth] = useState<number>(2000);
  const [inputHeight, setInputHeight] = useState<number>(2000);

  const render = useCallback(async () => {
    const canvas = _canvasRef.current?.getCanvas();
    if (!canvas) return;

    const width = canvas.getWidth();
    const height = canvas.getHeight();

    if (!placeholder) return;

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
    fabricWarpvas.enterEditing(object, null, new modes.Perspective(), (texture) => {
      texture.setInputLimitSize({
        width: inputWidth,
        height: inputHeight,
      });
    });
    _fabricWarpvasRef.current = fabricWarpvas;

    // 隐藏源元素
    object.set({ visible: false });
    canvas.renderAll();
  }, [placeholder]);

  useEffect(() => {
    render();
  }, [render]);

  const changeLimitSize = useCallback(
    (type: 'width' | 'height') => {
      return (value: number) => {
        const fabricWarpvas = _fabricWarpvasRef.current;
        if (!fabricWarpvas) return;

        fabricWarpvas.warpvas?.setInputLimitSize({
          width: inputWidth,
          height: inputHeight,
          [type]: value,
        });

        fabricWarpvas.requestRender();

        // 同步参数
        ({ width: setInputWidth, height: setInputHeight })[type](value);
      };
    },
    [inputWidth, inputHeight],
  );

  return (
    <div className={styles.demo}>
      <Canvas className={styles.canvas} ref={_canvasRef} />
      <Code
        className={styles.code}
        link="sections/more-configuration/codes/limit-texture-input-size-demo.ts"
      >
        {(key) => {
          switch (key) {
            case 'input-width':
              return (
                <TextValue
                  value={inputWidth}
                  min={0}
                  max={9999}
                  onChange={changeLimitSize('width')}
                />
              );
            case 'input-height':
              return (
                <TextValue
                  value={inputHeight}
                  min={0}
                  max={9999}
                  onChange={changeLimitSize('height')}
                />
              );
          }
        }}
      </Code>
    </div>
  );
};

export default LimitTextureInputSize;
