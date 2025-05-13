import React from 'react';
import styles from './style.less';

const TextSwitch: React.FC<{
  value: boolean;
  onChange?: (value: boolean) => void;
}> = ({ value, onChange }) => {
  return (
    <span className={styles.textSwitch} onClick={() => onChange?.(!value)}>
      {value ? 'true' : 'false'}
    </span>
  );
};

export default TextSwitch;
