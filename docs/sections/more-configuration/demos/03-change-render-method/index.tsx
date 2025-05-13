import React, { useCallback, useContext, useEffect, useState } from 'react';
import classnames from 'classnames';
import { Warpvas } from 'Warpvas';
import { Code, CodePreview, TextSwitch } from 'docs/components';
import { DocsContext } from 'docs/docs';
import styles from './style.less';

const ChangeRenderMethod = () => {
  const { placeholder } = useContext(DocsContext);

  const [preview, setPreview] = useState<string>();
  const [method, setMethod] = useState<'canvas' | 'webgl'>('webgl');
  const [isAntialias, setAntialias] = useState<boolean>(true);
  const [duration, setDuration] = useState<number>();

  const render = useCallback(async () => {
    if (!placeholder) return;
    const { naturalWidth, naturalHeight } = placeholder;

    const canvas = document.createElement('canvas');
    canvas.width = naturalWidth;
    canvas.height = naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(placeholder, 0, 0);

    const texture = new Warpvas(canvas);

    texture
      .setSplitUnit(0.01)
      .setInputLimitSize({ width: 2000, height: 2000 })
      .setOutputLimitSize({ width: 2000, height: 2000 })
      .setRenderingConfig({
        enableAntialias: isAntialias,
      })
      .setRenderingContext(
        (
          {
            canvas: '2d',
            webgl: 'webgl',
          } as const
        )[method],
      )
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

    const start = performance.now();
    const result = texture.render();
    const end = performance.now();

    setPreview(result.toDataURL());
    setDuration(end - start);
  }, [placeholder, method, isAntialias]);

  useEffect(() => {
    render();
  }, [render]);

  return (
    <div className={styles.demo}>
      {placeholder && preview && (
        <CodePreview className={styles.preview} src={preview}>
          {duration && <div className={styles.duration}>合成耗时：{Math.ceil(duration)}ms</div>}
        </CodePreview>
      )}
      <Code
        className={styles.code}
        link="sections/more-configuration/codes/change-render-method-demo.ts"
      >
        {(key) => {
          switch (key) {
            case 'canvas-render':
              return (
                <p
                  className={classnames(styles.method, {
                    [styles.option]: method === 'webgl',
                  })}
                  onClick={() => setMethod('canvas')}
                >
                  <span className={styles.text}>.useCanvasRender()</span>
                </p>
              );
            case 'webgl-render':
              return (
                <p
                  className={classnames(styles.method, {
                    [styles.option]: method === 'canvas',
                  })}
                  onClick={() => setMethod('webgl')}
                >
                  <span className={styles.text}>.useWebGLRender()</span>
                </p>
              );
            case 'antialias':
              return <TextSwitch value={isAntialias} onChange={setAntialias} />;
          }
        }}
      </Code>
    </div>
  );
};

export default ChangeRenderMethod;
