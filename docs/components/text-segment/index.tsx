import React from 'react';
import classnames from 'classnames';
import styles from './style.less';

interface TextSegmentProps {
  value: unknown;
  options: { label: string; hoverLabel?: string; value: string }[];
  onChange?: (value: unknown) => void;
}

const TextSegment: React.FC<TextSegmentProps> = ({ value: _value, options, onChange }) => {
  return (
    <div className={styles.segment}>
      {options.map(({ value, label, hoverLabel }) => {
        return (
          <div
            key={value}
            className={classnames(styles.option, {
              [styles.selected]: value === _value,
            })}
            onClick={() => onChange?.(value)}
          >
            <span>{label}</span>
            {hoverLabel && <span className={styles.tooltip}>{hoverLabel}</span>}
          </div>
        );
      })}
    </div>
  );
};

export default TextSegment;
