import React from 'react';
import classnames from 'classnames';
import styles from './style.less';

const TextSlider: React.FC<{
  className?: string;
  value: number;
  step: number;
  min: number;
  max: number;
  onChange?: (value: number) => void;
}> = ({ className, value, step = 0.01, min = 0, max = 1, onChange }) => {
  return (
    <div className={classnames(styles.slider, className)}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onInput={(e) => onChange?.(Number((e.target as HTMLInputElement).value))}
      />
      <span>{value}</span>
    </div>
  );
};

export default TextSlider;
