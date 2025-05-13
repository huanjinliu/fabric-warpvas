import React, { memo, useCallback, useEffect, useState } from 'react';
import markdownit from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItHighlight from 'markdown-it-highlightjs';
import styles from './style.less';

const Markdown: React.FC<{ path: string }> = ({ path }) => {
  const [content, setContent] = useState<string>('');

  const loadFile = useCallback(() => {
    fetch(path)
      .then((response) => response.text())
      .then((text) => {
        // 移除文档开头
        let content = text;
        content = content.split('\n').slice(4).join('\n');
        // 移除链接，只保留文字部分
        const regex = /\[([^\]]+)\]\([^)]+\)/g;
        const replacement = '$1';
        content = content.replace(regex, replacement);
        setContent(content);
      });
  }, []);

  const md = markdownit().use(markdownItAnchor).use(markdownItHighlight);

  useEffect(loadFile, []);

  return (
    <div className={styles.markdown} dangerouslySetInnerHTML={{ __html: md.render(content) }} />
  );
};

export default memo(Markdown);
