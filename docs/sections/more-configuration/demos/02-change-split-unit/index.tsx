import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Warpvas } from 'Warpvas';
import { Code, CodePreview, TextSlider, TextSwitch } from 'docs/components';
import { DocsContext } from 'docs/docs';
import styles from './style.less';

const ChangeSplitUnit = () => {
  const { placeholder } = useContext(DocsContext);

  const [preview, setPreview] = useState<string>();
  const [splitUnit, setSplitUnit] = useState<number>(0.05);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  const render = useCallback(() => {
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
      .setSplitUnit(splitUnit)
      .setRenderingConfig({ enableGridDisplay: showGrid })
      .setRenderingCanvas(document.createElement('canvas'))
      .setInputLimitSize({ width: 2000, height: 2000 })
      .setOutputLimitSize({ width: 2000, height: 2000 })
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

    setPreview(texture.render().toDataURL());
  }, [placeholder, splitUnit, showGrid]);

  useEffect(() => {
    render();
  }, [render]);

  return (
    <div className={styles.demo}>
      {placeholder && preview && <CodePreview className={styles.preview} src={preview} />}
      <Code
        className={styles.code}
        link="sections/more-configuration/codes/change-split-unit-demo.ts"
      >
        {(key) => {
          switch (key) {
            case 'show-grid':
              return <TextSwitch value={showGrid} onChange={setShowGrid} />;
            case 'unit':
              return (
                <TextSlider
                  className={styles.slider}
                  value={splitUnit}
                  step={0.01}
                  min={0.01}
                  max={1}
                  onChange={setSplitUnit}
                />
              );
          }
        }}
      </Code>
    </div>
  );
};

export default ChangeSplitUnit;
