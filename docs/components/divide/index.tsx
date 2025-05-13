import React from 'react';
import styles from './style.less';

const Divide: React.FC<{ id?: string; title: string; href?: string }> = ({ id, title, href }) => {
  return (
    <div className={styles.divide} id={id}>
      {href || id ? (
        <a href={href ?? `#${id}`} target={href ? '_blank' : '_self'}>
          {title}
        </a>
      ) : (
        <span>{title}</span>
      )}
    </div>
  );
};

export default Divide;
