import React, { memo } from 'react';
import classnames from 'classnames';

export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, 'fontSize'> {
  name: string;
  size?: number;
}

const Icon: React.FC<IconProps> = ({
  className,
  name,
  size = 48,
  color = 'currentColor',
  ...rest
}) => {
  return (
    <svg
      {...rest}
      className={classnames('icon', className)}
      aria-hidden="true"
      fontSize={size}
      color={color}
    >
      <use xlinkHref={`#icon-${name}`}></use>
    </svg>
  );
};

export default memo(Icon);
