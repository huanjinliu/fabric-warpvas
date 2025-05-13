import React from 'react';
import Message from 'docs/components/message';
import Divide from 'docs/components/divide';
import ChangeRenderOptions from './demos/01-change-render-options';
import ChangeSplitUnit from './demos/02-change-split-unit';
import ChangeRenderMethod from './demos/03-change-render-method';
import LimitTextureInputSize from './demos/04-limit-texture-input-size';
import LimitTextureOutputSize from './demos/05-limit-texture-output-size';
import { Quote } from 'docs/components';

const MoreConfiguration = () => {
  return (
    <section>
      <Divide id="more-configuration" title="更多配置" />
      <Message.left>接下来我将为你介绍一下它的配置项。</Message.left>
      <Message.right>十分期待！</Message.right>
      <Message.left>
        <p>
          进入编辑模式的方法
          <Quote starting>enterEditing(object, sourceCanvas, mode, beforeFirstRender)</Quote>
          中每个参数都有着非常重要的作用， 其中：
        </p>
        <p>
          · <Quote>sourceCanvas</Quote>
          用于指定变形中应用的图像画布，它支持你使用目标元素的偏移等配置的同时使用另一张图像进行变形，
          如果元素已经经过一次变形，此刻再进入变形，默认图像将是错误的，你需要传入未变形画布作为参数，否则将不会达到预期；
        </p>
        <p>
          · <Quote>beforeFirstRender</Quote>
          是一个可选的回调函数，你可以在初始化的回调中配置变形参数，也可以在回调外动态配置。
        </p>
      </Message.left>
      <Message.left>
        如果你想查看扭曲图像的三角形图元分割情况，你可以在
        <Quote>beforeFirstRender</Quote>
        回调中设置是否在变形的图像上显示分割线、分割点，当然你也可以将图像隐藏只显示分割线或分割点以从不同的视图下观察变形效果：
        <ChangeRenderOptions />
      </Message.left>
      <Message.right>那我能控制这个分割的数量吗？</Message.right>
      <Message.left>
        当然！你可以通过<Quote>setSplitUnit</Quote>
        方法设置分割的三角形图元大小比例（如0.1时单个三角形图元最大宽高为图像原始宽度的10%），分割比例越小分割数量越多，变形的图像也会越精细。
        <ChangeSplitUnit />
      </Message.left>
      <Message.right>
        看起来非常棒👍🏻但是我感觉当分割比例太小时交互变得非常卡顿，这有什么办法优化吗？
      </Message.right>
      <Message.left>
        是的，这是不可避免的问题，所以在业务实现时你需要在精细度和效率之间做权衡，不过我也有为性能提升这方面作出努力，默认配置下会使用
        <Quote>WebGL</Quote>绘制来加快变形图像的绘制，但如果浏览器不支持
        <Quote>WebGL</Quote>
        默认将自动退级使用<Quote>Canvas 2D</Quote>绘制。
      </Message.left>
      <Message.left>
        不过当然也允许你自行配置使用何种方法绘制，以及是否开启抗锯齿效果（默认开启），但你要注意的是，不同的绘制方法绘制的效果也是不一样的，两者相比，
        <Quote>WebGL</Quote>绘制更快，但<Quote>Canvas 2D</Quote>
        绘制小图时内部图案更精细（但遗憾的是，当前Canvas2D绘制的算法下存在边缘毛躁问题😥）：
        <ChangeRenderMethod />
      </Message.left>
      <Message.left>
        应用大图的情况下两者的最后效果差异不大，更建议使用<Quote>WebGL</Quote>
        加快绘制速度。
      </Message.left>
      <Message.right>记住了！对了，那我应用大图的话，那是不是会特别卡顿？</Message.right>
      <Message.left>
        当然是有考虑到应用大图时的性能问题，也许你会想，能不能在交互变形的时候使用压缩图像改善交互体验，然后在结束交互后重新使用原图像变形，这是很自然而然会想到的优化方式，所以我在实现
        <Quote>FabricWarpvas</Quote>时，内部默认当宽高超过<Quote>2000px</Quote>
        时使用压缩图。如果你想自己控制这个压缩上限值，你可以这么做：
        <LimitTextureInputSize />
      </Message.left>
      <Message.left>
        既然都可以限制输入图尺寸，那当然同样也可以限制输出图尺寸：
        <LimitTextureOutputSize />
      </Message.left>
      <Message.left>
        但稍有不同的是，输出图默认没有做尺寸限制，如果你在交互变形的时候突然发现图像消失变透明了，请不要慌张，那是因为图像变形的尺寸超出浏览器画布尺寸限制了，导致无法成功合成，这时候你就有必要限制一下输出图尺寸了。
      </Message.left>
      <Message.right>
        这里我有个疑惑，你能介绍一下<Quote>Warpvas</Quote>
        对象吗？我看上面一直有出现这个对象。
      </Message.right>
      <Message.left>
        <Quote starting link="https://huanjinliu.github.io/warpvas/">
          warpvas.js
        </Quote>
        是实现扭曲图像的画布库，也是这个库的核心依赖库，这里返回的
        <Quote>Warpvas</Quote>
        对象便是该库的实例对象，上述提到的配置都是基于该库本身的支持，
        所以除了上面的常见配置，你可以前往它的文档页查看更多使用方法，包括使用
        <Quote>Web Worker</Quote>进行变形等等。
      </Message.left>
      <Message.right>非常赞👍🏻，这些配置相信会在我往后的使用中带来非常大的帮助！</Message.right>
      <Message.left>非常感谢你的肯定~</Message.left>
    </section>
  );
};

export default MoreConfiguration;
