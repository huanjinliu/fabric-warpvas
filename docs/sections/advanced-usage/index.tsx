import React from 'react';
import { Code, Divide, Message, Quote } from 'docs/components';
import Customization from './demos/01-customization';
import ApplyConvetMode from './demos/02-apply-convet-mode';
import styles from './style.less';

const AdvancedUsage = () => {
  return (
    <section>
      <Divide id="advanced-usage" title="进阶使用" />
      <Message.left>
        对了，这个库虽然只内置了<Quote>扭曲、透视</Quote>
        两种变形模式，但并不妨碍你创造新的变形模式， 你可以使用
        <Quote>AbstractMode</Quote>
        抽象类自定义一个
        <Quote>全新的变形模式对象（Mode）</Quote>。
      </Message.left>
      <Message.left>
        如果你感兴趣，不妨跟随我一同实现<Quote>凸面镜</Quote>模式：
        <Customization />
      </Message.left>
      <Message.right>哇！这是个非常有趣的效果！</Message.right>
      <Message.left>
        实现自定义变形模式的第一步就是需要先创建一个自定义的变形模式类，它具体实现于库中提供的
        <Quote>AbstractMode</Quote>抽象类：
        <Code
          className={styles.code}
          link={'./sections/advanced-usage/codes/learn-abstract-mode.ts'}
        />
      </Message.left>
      <Message.left>
        当你知道如何具体实现一个自定义的变形模式类后，你就可以放开手脚去实现了，由于篇幅问题，这里就不展开具体实现的代码了，但你可以查阅该
        <Quote>Github</Quote>项目中的
        <Quote link="https://github.com/huanjinliu/fabric-warpvas/blob/master/docs/sections/advanced-usage/demos/01-customization/index.tsx">示例代码</Quote>
        来学习其具体实现。
      </Message.left>
      <Message.left>
        这里当我们实现了新交互模式<Quote>ConvexMode</Quote>类后就可将其应用到
        <Quote>FabricWarpvas</Quote>中啦：
        <ApplyConvetMode />
      </Message.left>
      <Message.right>这效果真的很棒👍🏻~</Message.right>
      <Message.left>
        对了，这里需要注意的是由于模式之间的变形策略可能不同，所以当前是不支持变形中途切换模式的，你需要先调用
        <Quote>leaveEditing()</Quote>结束当前模式。
      </Message.left>
    </section>
  );
};

export default AdvancedUsage;
