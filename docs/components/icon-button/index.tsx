import React, { memo } from 'react';
import classnames from 'classnames';
import styles from './style.less';
import Icon, { type IconProps } from '../icon';

interface IconButtonProps extends IconProps {
  active?: boolean;
}

const IconButton: React.FC<IconButtonProps> = ({
  className,
  active = false,
  onClick,
  children,
  ...rest
}) => {
  return (
    <div
      className={classnames(styles.iconButton, className, {
        [styles.active]: active,
      })}
    >
      <Icon className={styles.icon} {...rest} onClick={onClick}></Icon>
      {children}
    </div>
  );
};

export default memo(IconButton);
