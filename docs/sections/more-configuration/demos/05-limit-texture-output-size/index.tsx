import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
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

const LimitTextureOutputSize = () => {
  const { placeholder } = useContext(DocsContext);

  const _canvasRef = useRef<CanvasHandlers>(null);
  const _fabricWarpvasRef = useRef<FabricWarpvas>();

  const [outputWidth, setOutputWidth] = useState<number>(1000);
  const [outputHeight, setOutputHeight] = useState<number>(1000);

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
    const object = new fabric.Image(placeholder, {
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
      texture.setOutputLimitSize({
        width: outputWidth,
        height: outputHeight,
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

        fabricWarpvas.warpvas?.setOutputLimitSize({
          width: outputWidth,
          height: outputHeight,
          [type]: value,
        });

        fabricWarpvas.requestRender();

        // 同步参数
        ({ width: setOutputWidth, height: setOutputHeight })[type](value);
      };
    },
    [outputWidth, outputHeight],
  );

  return (
    <div className={styles.demo}>
      <Canvas className={styles.canvas} ref={_canvasRef} />
      <Code
        className={styles.code}
        link="sections/more-configuration/codes/limit-texture-output-size-demo.ts"
      >
        {(key) => {
          switch (key) {
            case 'output-width':
              return (
                <TextValue
                  value={outputWidth}
                  min={0}
                  max={9999}
                  onChange={changeLimitSize('width')}
                />
              );
            case 'output-height':
              return (
                <TextValue
                  value={outputHeight}
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

export default LimitTextureOutputSize;
