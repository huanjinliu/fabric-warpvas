import React from 'react';
import classnames from 'classnames';
import styles from './style.less';

const TextValue: React.FC<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> & {
    value: number;
    onChange?: (value: number) => void;
  }
> = ({ className, value, onChange, ...rest }) => {
  return (
    <input
      {...rest}
      className={classnames(styles.textValue, className)}
      type="number"
      value={value}
      onChange={(e) => onChange?.(Number(e.target.value))}
    ></input>
  );
};

export default TextValue;
