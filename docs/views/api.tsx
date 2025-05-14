import React, { memo } from 'react';
import { Divide, Markdown } from 'docs/components';

const API = () => {
  return (
    <section>
      <Divide id="utils-class" title="核心工具类" />
      <Markdown path="./api/index/classes/FabricWarpvas.md" />
      <Markdown path="./api/index/classes/AbstractMode.md" />
      <Divide id="inbuilt-modes-class" title="变形模式类" />
      <Markdown path="./api/index/classes/Perspective.md" />
      <Markdown path="./api/index/classes/Warp.md" />
    </section>
  );
};

export default memo(API);
