import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { FabricImage } from 'fabric/es';
import { FabricWarpvas } from 'fabric-warpvas';
import Warp from 'fabric-warpvas/modes/warp';
import Perspective from 'fabric-warpvas/modes/perspective';
import { Canvas as XCanvas, Code, Icon, Quote, TextSegment } from 'docs/components';
import type { CanvasHandlers } from 'docs/components/canvas';
import useUploader from 'docs/hooks/use-uploader';
import { DocsContext } from 'docs/docs';
import styles from './style.less';

/**
 * 分割点计算策略
 * @enum {string}
 */
enum Mode {
  /** 扭曲 */
  WARP = 'Warp',
  /** 透视 */
  PERSPECTIVE = 'Perspective',
}

const QuickStart = () => {
  const { placeholder, setPlaceholder } = useContext(DocsContext);

  const _canvasRef = useRef<CanvasHandlers>(null);
  const _fabricWarpvasRef = useRef<FabricWarpvas>();

  const uploader = useUploader();

  const [mode, setMode] = useState<Mode>(Mode.WARP);

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
    fabricWarpvas.enterEditing(
      object,
      null,
      {
        [Mode.WARP]: () => new Warp(),
        [Mode.PERSPECTIVE]: () => new Perspective(),
      }[mode](),
      (warpvas) => {
        // 限制尺寸避免过大导致卡死或无法显示
        warpvas
          .setInputLimitSize({ width: 2000, height: 2000 })
          .setOutputLimitSize({ width: 2000, height: 2000 });
      },
    );
    _fabricWarpvasRef.current = fabricWarpvas;

    // 隐藏源元素
    object.set({ visible: false });
    canvas.renderAll();
  }, [placeholder, mode]);

  useEffect(() => {
    render();
  }, [render]);

  return (
    <>
      <div className={styles.demo}>
        <XCanvas className={styles.canvas} ref={_canvasRef} />
        <Code className={styles.code} link="sections/quick-start/codes/quick-start-demo.ts">
          {(key) => {
            switch (key) {
              case 'upload-image':
                return (
                  <span
                    className={styles.uploadButton}
                    onClick={async () => {
                      const file = await uploader({
                        accept: 'image/jpg,image/jpeg,image/png,image/webp',
                        maxLength: 1024 ** 2,
                      });
                      if (!file) return;
                      const url = URL.createObjectURL(file);
                      const image = new Image();
                      image.onload = () => {
                        setPlaceholder(image);
                      };
                      image.src = url;
                    }}
                  >
                    <Icon className={styles.icon} size={20} name="upload-image"></Icon>
                    替换图片
                  </span>
                );
              case 'mode':
                return (
                  <TextSegment
                    value={mode}
                    options={[
                      { hoverLabel: '扭曲', label: Mode.WARP, value: Mode.WARP },
                      {
                        hoverLabel: '透视',
                        label: Mode.PERSPECTIVE,
                        value: Mode.PERSPECTIVE,
                      },
                    ]}
                    onChange={setMode as (mode: unknown) => void}
                  />
                );
            }
          }}
        </Code>
      </div>
      <br />
      {mode === Mode.PERSPECTIVE && (
        <>
          <Quote>「透视模式·交互说明」</Quote>
          <br />
          <Quote>①</Quote>
          拖动交互点实现透视的变换（PS：由于透视限制，形成三角形后无法进一步变换）
          <br />
          <Quote>②</Quote>空白区域持续拖拽形成整体变形
        </>
      )}
      {mode === Mode.WARP && (
        <>
          <Quote>「扭曲模式·交互说明」</Quote>
          <br />
          <Quote>①</Quote>拖动交互点实现扭曲点的变换，支持框选
          <br />
          <Quote>②</Quote>点击内部区域，会出现临时交互点
          <br />
          <Quote>③</Quote>拖动临时交互点实现整体移动
          <br />
          <Quote>④</Quote>点击临时交互点实现变形区域分割
          <br />
          <Quote>⑤</Quote>选中交互点后点击<Quote>Delete</Quote>
          实现扭曲点的删除（PS：四个原始对角交互点无法被删除）
        </>
      )}
    </>
  );
};

export default QuickStart;
