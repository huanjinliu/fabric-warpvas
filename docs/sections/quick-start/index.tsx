import React from 'react';
import QuickStartDemo from './demos/01-quick-start';
import { Code, Divide, Message, Quote } from 'docs/components';
import styles from './style.less';

const QuickStart = () => {
  return (
    <section>
      <Divide id="quick-start" title="快速开始" />
      <Message.left long>
        要使用这个工具库，首先你需要安装它，<Quote>fabric.js</Quote>
        作为对等依赖也需要同时安装：
        <Code className={styles.code} language="vim" link="sections/quick-start/codes/install.sh" />
      </Message.left>
      <Message.left long>
        <Quote starting>FabricWarpvas</Quote>
        类是这个库的核心类，使用它可以为<Quote>所有的Fabric元素对象</Quote>
        快速创建可交互的变形图像副本。
        <br />
        你可以与下面示例中的变形图像进行交互以感受它的风采:
        <QuickStartDemo />
      </Message.left>
      <Message.right>
        <span className={styles.amazing}>简直太棒了！</span>
      </Message.right>
    </section>
  );
};

export default QuickStart;
