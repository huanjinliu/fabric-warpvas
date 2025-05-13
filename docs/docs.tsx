import React, { useEffect, createContext, useState, useMemo } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import classnames from 'classnames';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import vim from 'highlight.js/lib/languages/vim';
import API from './views/api';
import Introduction from './views/introduction';
import { IconButton } from './components';
import { loadImage } from './utils';
import useUploader from './hooks/use-uploader';
import styles from './style.less';

hljs.registerLanguage('vim', vim);
hljs.registerLanguage('typescript', typescript);

export const DEFAULT_PLACEHOLDER = './resources/images/block.png';

export const DocsContext = createContext<{
  placeholder: HTMLImageElement | undefined;
  setPlaceholder: React.Dispatch<React.SetStateAction<HTMLImageElement | undefined>>;
}>({
  placeholder: undefined,
  setPlaceholder: () => {},
});

const Docs = () => {
  const [placeholder, setPlaceholder] = useState<HTMLImageElement>();
  const [outlineVisible, setOutlineVisible] = useState<boolean>(false);

  const location = useLocation();
  const uploader = useUploader();

  // 当前页面大纲
  const outline = useMemo<
    {
      title: string;
      anchor: string;
      group?: boolean;
      children?: {
        title: string;
        anchor: string;
      }[];
    }[]
  >(() => {
    if (location.pathname === '/') {
      return [
        { title: '快速开始', anchor: 'quick-start' },
        { title: '更多配置', anchor: 'more-configuration' },
        { title: '进阶使用', anchor: 'advanced-usage' },
        { title: '使用注意', anchor: 'usage-notes' },
      ];
    } else if (location.pathname === '/documentation') {
      return [
        {
          title: '核心工具类',
          anchor: 'utils-class',
          group: true,
          children: [
            { title: 'FabricWarpvas', anchor: 'class%3A-fabricwarpvas' },
            { title: 'AbstractMode', anchor: 'class%3A-abstract-abstractmode' },
          ],
        },
        {
          title: '变形模式类',
          anchor: 'inbuilt-modes-class',
          group: true,
          children: [
            { title: 'Perspective', anchor: 'class%3A-perspective' },
            { title: 'Warp', anchor: 'class%3A-warp' },
          ],
        },
      ];
    } else {
      return [];
    }
  }, [location]);

  // 加载占位图
  useEffect(() => {
    loadImage(DEFAULT_PLACEHOLDER).then(setPlaceholder);
  }, []);

  // 如果有锚点，自动滚动到该锚点
  useEffect(() => {
    window.onload = function () {
      const anchor = window.location.hash;
      if (anchor) {
        const element = document.querySelector(anchor);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };
  }, []);

  return (
    <DocsContext.Provider value={{ placeholder, setPlaceholder }}>
      <div className={styles.docs}>
        <header>
          <h1>Fabric Warpvas</h1>
          <p>帮助你在 Fabric.js 上高效构建图像变形工具。</p>
        </header>
        <nav className={styles.tab}>
          {[
            { path: '/', label: '介绍' },
            { path: '/documentation', label: '文档' },
          ].map((item, index, arr) => (
            <>
              <Link
                className={classnames(styles.tabItem, {
                  [styles.active]: location.pathname === item.path,
                })}
                to={item.path}
              >
                {item.label}
              </Link>
              {index < arr.length - 1 && <span className={styles.divide}>/</span>}
            </>
          ))}
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<Introduction />} />
            <Route path="/documentation" element={<API />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer>
          <div
            className={classnames(styles.outline, {
              [styles.hidden]: !outlineVisible,
            })}
          >
            <div className={styles.buttons}>
              <IconButton
                name="github"
                size={32}
                onClick={() => {
                  window.open('https://github.com/huanjinliu/fabric-warpvas', '_blank');
                }}
              />
              <IconButton
                name="upload-image"
                size={32}
                onClick={async () => {
                  const file = await uploader({
                    accept: 'image/jpg,image/jpeg,image/png,image/webp',
                    maxLength: 1024 ** 4,
                  });
                  if (!file) return;
                  const url = URL.createObjectURL(file);
                  const image = new Image();
                  image.onload = () => {
                    if (placeholder) URL.revokeObjectURL(placeholder.src);
                    setPlaceholder(image);
                  };
                  image.src = url;
                }}
              >
                {placeholder && <img className={styles.uploadImage} src={placeholder.src}></img>}
              </IconButton>
              <IconButton
                name="scroll-to-top"
                size={32}
                onClick={() => {
                  const container = document.querySelector('#docs')?.children[0];
                  container?.scrollTo({ top: 0 });
                }}
              />
            </div>
            <IconButton
              className={styles.outlineButton}
              name="outline"
              size={32}
              onClick={() => setOutlineVisible(!outlineVisible)}
            />
            <ul className={styles.outlineContent}>
              {outline.map(({ title, anchor, group, children = [] }) => {
                if (group) {
                  return (
                    <>
                      <li className={styles.outlineGroupName}>{title}</li>
                      {children.map((child) => (
                        <li key={child.anchor}>
                          <a href={`#${child.anchor}`}>{child.title}</a>
                        </li>
                      ))}
                    </>
                  );
                }
                return (
                  <li key={anchor}>
                    <a href={`#${anchor}`}>{title}</a>
                  </li>
                );
              })}
            </ul>
          </div>
        </footer>
      </div>
    </DocsContext.Provider>
  );
};

export default Docs;
