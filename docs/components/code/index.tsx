import React, { memo, useEffect, useState } from 'react';
import classnames from 'classnames';
import styles from './style.less';
import hljs from 'highlight.js';
import Icon from '../icon';

const InlineCode = memo(
  ({
    language = 'typescript',
    children,
  }: {
    language?: 'vim' | 'typescript';
    children: string;
  }) => {
    return (
      <span
        dangerouslySetInnerHTML={{
          __html: hljs.highlight(children, { language }).value,
        }}
      ></span>
    );
  },
);

type CodeProps = {
  link?: string;
  collapse?: boolean;
  language?: 'vim' | 'typescript';
  lineCount?: number;
  className?: string;
  children?: (key: string) => React.ReactNode | void;
};

const Code: React.FC<CodeProps> = ({
  className,
  collapse = false,
  link,
  lineCount = 0,
  language,
  children,
}) => {
  const [lines, setLines] = useState<React.ReactNode>();
  const [collapseCode, setCollapseCode] = useState<boolean>(collapse);

  useEffect(() => {
    if (!link) return;
    fetch(link)
      .then((response) => {
        if (!response.ok || !response.body) {
          throw new Error('获取代码失败');
        }
        // 读取文件链接中的内容
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = '';
        return new Promise<string>((resolve) => {
          const read = () => {
            return reader.read().then(({ done, value }) => {
              if (done) {
                return resolve(result);
              }
              result += decoder.decode(value, { stream: true });
              return read();
            });
          };
          read();
        });
      })
      .then((data) => {
        const parts = data.split(/\/\*---\*\//);
        const visibleData = parts.length > 1 ? parts.filter((_, idx) => idx % 2).join('') : data;
        const lines = visibleData
          .split('\n')
          .filter(Boolean)
          .map((line, index) => {
            const parts = line.split(/(\/\*-.+?-\*\/.+?\/\*\*\/)/);
            return (
              <div key={index} className={styles.line}>
                {parts.map((part, partIdx) => {
                  const result = part.match(/\/\*-(.+?)-\*\/(.+?)\/\*\*\//);
                  if (!result)
                    return (
                      <InlineCode key={partIdx} language={language}>
                        {part}
                      </InlineCode>
                    );
                  const [_, key, string] = result;
                  return (
                    <span key={partIdx}>
                      {children?.(key) ?? <InlineCode language={language}>{string}</InlineCode>}
                    </span>
                  );
                })}
              </div>
            );
          });
        setLines(lines);
      });
  }, [link, children]);

  return (
    <div className={classnames(styles.code, className)}>
      <div
        className={styles.content}
        style={{
          minHeight: `${lineCount * 32}px`,
          maxHeight:
            collapse && collapseCode
              ? `320px`
              : `${(React.Children.toArray(lines).length + 1) * 32}px`,
        }}
      >
        <pre>{lines}</pre>
        {collapse && (
          <div className={styles.toggle} onClick={() => setCollapseCode(!collapseCode)}>
            <Icon
              className={styles.icon}
              name={collapseCode ? 'down-arrow' : 'up-arrow'}
              size={18}
              color="gray"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(Code);
