import React from 'react';
import styles from './style.less';
import classnames from 'classnames';

interface QuoteProps {
  link?: string;
  starting?: boolean;
  children: string;
}

const Quote: React.FC<QuoteProps> = ({ link, starting, children }) => {
  return (
    <span className={classnames(styles.quote, { [styles.starting]: starting })}>
      {link ? (
        <a href={link} target="_blank">
          {children}
        </a>
      ) : (
        children
      )}
    </span>
  );
};

export default Quote;
