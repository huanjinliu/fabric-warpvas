import React from 'react';
import classnames from 'classnames';
import styles from './style.less';

interface BubbleProps {
  avatar: string;
  long?: boolean;
  className?: string;
  position?: 'left' | 'right';
  children?: React.ReactNode;
}

const Bubble: React.FC<BubbleProps> = ({
  className,
  avatar,
  long = false,
  position = 'left',
  children,
}) => {
  return (
    <section
      className={classnames(styles.bubble, className, {
        [styles[position]]: true,
        [styles.long]: long,
      })}
    >
      <div className={styles.avatar}>
        <img src={`resources/${avatar}`} alt="Avatar" />
      </div>
      <main>
        <div className={styles.content}>
          <div>{children}</div>
        </div>
      </main>
      <div className={styles.block}></div>
    </section>
  );
};

export default Bubble;
