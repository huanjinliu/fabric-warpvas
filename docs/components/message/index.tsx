import React from 'react';
import Bubble from '../bubble';

const Message = {
  left: ({ long = false, children }) => (
    <Bubble long={long} avatar="images/avatar.png" position="left">
      {children}
    </Bubble>
  ),
  right: ({ long = false, children }) => (
    <Bubble long={long} avatar="images/author-avatar.webp" position="right">
      {children}
    </Bubble>
  ),
};

export default Message;
