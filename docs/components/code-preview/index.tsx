import React, { memo } from 'react';
import classnames from 'classnames';
import styles from './style.less';

interface CodePreviewProps {
  src?: string;
  className?: string;
  children?: React.ReactNode;
}

const CodePreview: React.FC<CodePreviewProps> = ({ src, className, children }) => {
  if (!src) return null;
  return (
    <div className={classnames(styles.preview, className)}>
      <img src={src} alt="preview" />
      {children}
    </div>
  );
};

export default memo(CodePreview);
