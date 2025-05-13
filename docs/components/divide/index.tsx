import React, { useCallback } from 'react';
import styles from './style.less';

const Divide: React.FC<{ id?: string; title: string; href?: string }> = ({ id, title, href }) => {
  return (
    <div className={styles.divide} id={id}>
      {href ? (
        <a href={href} target="_blank">
          {title}
        </a>
      ) : (
        <span>{title}</span>
      )}
    </div>
  );
};

export default Divide;
