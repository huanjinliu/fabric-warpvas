import React from 'react';
import Message from 'docs/components/message';
import Divide from 'docs/components/divide';
import { Code, Quote } from 'docs/components';
import styles from './style.less';

const UsageNotes = () => {
  return (
    <section>
      <Divide id="usage-notes" title="使用注意" />
      <Message.left>讲到这里我也就介绍完它的基础使用了，你还有什么其他的疑惑呢？</Message.left>
      <Message.right>我能自定义变形模式中交互元素的样式吗？</Message.right>
      <Message.left>
        <p>
          交互元素是否能够自定义样式取决于模式类本身是否有提供定制元素样式的方法或配置，该库内置的扭曲和透视模式类构造方法中对外提供了
          主题色相关的配置字段，如
          <Quote>{`new Warp({ themeColor: 'black' })`}</Quote>
          （设置控制点主题色为黑色）。
        </p>
        <p>
          另外还提供了<Quote>registerStyleSetter</Quote>
          方法用于在注册自定义交互元素的样式，但如果你对
          <Quote>Fabric.js</Quote>熟悉，你甚至可以拿图像元素做交互元素。
        </p>
      </Message.left>
      <Message.right>了解了，非常感谢你的解答。</Message.right>
      <Message.left>
        另外这里还有两点需要提醒一下：
        <p>
          <Quote starting>①</Quote>请确保安装正确的<Quote>Fabric.js</Quote>
          版本，当前v1版本是基于fabricjs-v6版本, 如果还在使用fabricjs-v5及以前的版本请安装对应
          <Quote>v0版本</Quote>，但v0版本后续仅维护缺陷， 如有需要请自主
          <Quote>Fork</Quote>。
        </p>
        <p>
          <Quote starting>②</Quote>由于该扭曲编辑器基于<Quote>Fabric.js</Quote>
          实现，为了保证该库的使用不会对原有画布造成破坏，
          也为了保留库的灵活性和可扩展性，很多操作并没有内置，如：开启画布框选、隐藏目标元素（元素进入编辑实际是克隆了一个全新的元素加入画布）等等。
          如果<strong>有需要</strong>请做以下初始化操作：
          <Code
            className={styles.code}
            language="typescript"
            link="sections/usage-notes/codes/initial.ts"
          />
        </p>
      </Message.left>
      <Message.right>非常感谢你的分享～</Message.right>
      <Message.left>😎🤝</Message.left>
    </section>
  );
};

export default UsageNotes;
