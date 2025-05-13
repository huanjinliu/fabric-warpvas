[**fabric-warpvas**](../../README.md)

***

# Class: FabricWarpvas

Fabric.js 变形工具类

为 Fabric.js 对象提供快捷的变形功能，支持：
- 网格化变形：将图像划分为多个可调整的变形网格
- 交互式编辑：支持拖拽交互调整变形效果
- 历史记录：支持撤销/重做/重置操作
- 性能优化：自动压缩大尺寸图像，优化渲染性能

## Example

```typescript
import { FabricWarpvas } from 'fabric-warpvas';
import Warp from 'fabric-warpvas/modes/warp';

// 1. 创建 Fabric.js 画布
const canvas = new fabric.Canvas('canvas');

// 2. 初始化变形工具
const fabricWarpvas = new FabricWarpvas(canvas, {
  enableHistory: true, // 启用历史记录
});

// 3. 准备需要变形的 fabric 元素对象，不限于图像元素
const image = new fabric.Image(imageElement);
canvas.add(image);

// 4. 进入扭曲变形模式
fabricWarpvas.enterEditing(image, null, new Warp());

// 5. 完成编辑后退出
fabricWarpvas.leaveEditing();
```

## Remarks

使用前请确保已正确安装并引入 fabric.js

## See

 - AbstractMode 查看如何自定义变形模式
 - Warpvas 了解底层变形实现

## Constructors

### new FabricWarpvas()

> **new FabricWarpvas**(`canvas`, `options`?): [`FabricWarpvas`](FabricWarpvas.md)

创建 FabricWarpvas 实例

初始化一个变形工具实例，该实例将与指定的 Fabric.js 画布关联，用于处理画布上的元素变形操作。

#### Parameters

##### canvas

`Canvas`

Fabric.js 画布实例

##### options?

`Partial`\<`FabricWarpvasOptions`\> = `{}`

配置选项

#### Returns

[`FabricWarpvas`](FabricWarpvas.md)

#### Example

```typescript
const canvas = new fabric.Canvas('canvas');
const warpvas = new FabricWarpvas(canvas);
```

#### Remarks

1. 创建实例后，需要调用 enterEditing 方法才能开始编辑
2. 启用历史记录会消耗额外的内存，请根据实际需求选择是否启用

## Properties

### canvas

> **canvas**: `Canvas`

Fabric.js 画布实例，作为变形的载体画布

***

### curvePathMap

> **curvePathMap**: `WeakMap`\<`Bezier`, `Path`\>

贝塞尔曲线到路径对象的映射，用于快速查找曲线对应的路径对象

***

### mode

> **mode**: `null` \| [`AbstractMode`](AbstractMode.md) = `null`

当前激活的变形模式，控制图像变形的交互方式和效果

#### Default

```ts
null
```

***

### options

> **options**: `FabricWarpvasOptions`

实例配置选项，包含历史记录开关和变化监听器等配置

***

### pathCurveMap

> **pathCurveMap**: `WeakMap`\<`Path`, `Bezier`\>

路径对象到贝塞尔曲线的映射，用于快速查找路径对应的曲线对象

***

### paths?

> `optional` **paths**: `Path`[]

网格路径元素列表，存储所有用于表示网格线的 Fabric.Path 对象

#### Remarks

用于显示变形网格和处理交互

***

### target

> **target**: `null` \| `Object` = `null`

当前正在编辑的 Fabric 对象，可以是任何 Fabric.js 对象类型（图片、文本等）

#### Default

```ts
null
```

***

### targetCanvas

> **targetCanvas**: `null` \| `HTMLCanvasElement` = `null`

目标对象的画布表示，存储目标对象的原始图像数据

#### Default

```ts
null
```

***

### warpvas

> **warpvas**: `null` \| `Warpvas` = `null`

核心变形引擎实例，负责处理底层的图像变形计算

#### Default

```ts
null
```

***

### warpvasObject?

> `optional` **warpvasObject**: `Image`

变形后的图像对象，在画布上显示的实际图像对象

## Methods

### enterEditing()

> **enterEditing**(`target`, `sourceCanvas`, `mode`, `beforeFirstRender`?): `void`

进入变形模式

使指定的 Fabric 对象进入变形变形状态，该操作会克隆目标对象，并默认使用该克隆对象的画布图像作为变形源图像。

#### Parameters

##### target

`Object`

目标变形 Fabric 对象（如图片、文本等）

##### sourceCanvas

可选的源画布，用于特殊渲染需求，如果为 null，将使用 target 克隆对象的图像画布。

`null` | `HTMLCanvasElement`

##### mode

[`AbstractMode`](AbstractMode.md)

变形模式实例，决定了变形的交互方式和效果

##### beforeFirstRender?

(`warpvas`) => `void`

首次渲染前的回调函数，可用于初始化变形引擎的配置

#### Returns

`void`

#### Remarks

sourceCanvas 用于指定变形中应用的图像画布，它支持你使用目标元素的偏移等配置的同时使用另一张图像进行变形，
如果元素已经经过一次变形，此刻再进入变形，默认图像将是错误的，你需要传入未变形画布作为参数，否则将不会达到预期。

#### Example

```typescript
fabricWarpvas.enterEditing(
  target,
  null,
  new Wrap(),
  (warpvas) => {
    // 设置显示分割网格线
    warpvas.setRenderingConfig({ enableGridDisplay: true });
  }
);
```

#### See

leaveEditing 退出变形模式

***

### getMode()

> **getMode**\<`T`\>(): `null` \| `T`

获取当前的变形模式

#### Type Parameters

• **T** *extends* [`AbstractMode`](AbstractMode.md) = [`AbstractMode`](AbstractMode.md)

#### Returns

`null` \| `T`

- 如果当前不在变形状态，返回 null
- 否则返回当前变形模式类实例

***

### getWarpState()

> **getWarpState**(): `null` \| `WarpState`

提取当前变形状中的变形数据

#### Returns

`null` \| `WarpState`

- 如果当前不在变形状态，返回 null
- 否则返回变形数据

***

### leaveEditing()

> **leaveEditing**(): `void`

退出变形模式

#### Returns

`void`

#### Example

```typescript
// 完成编辑后退出
fabricWarpvas.leaveEditing();

// 完整的变形流程
try {
  // 1. 进入变形状态
  fabricWarpvas.enterEditing(target, null, new Warp());

  // 2. 进行变形操作...

  // 3. 保存变形数据
  const result = fabricWarpvas.getWarpState();

  // 4. 退出变形模式
  fabricWarpvas.leaveEditing();
} catch (error) {
  console.error('变形过程出错:', error);
  fabricWarpvas.leaveEditing(); // 确保清理资源
}
```

#### See

enterEditing 进入变形模式

***

### record()

> **record**(): `void`

记录当前变形状态

将当前的变形状态保存到历史记录中。

#### Returns

`void`

#### Remarks

1. 仅在启用了历史记录功能时生效（options.enableHistory = true）
2. 每次记录都会创建状态的深拷贝，注意内存占用

#### See

 - undo 撤销操作
 - redo 重做操作

***

### redo()

> **redo**(): `void`

重做已撤销的变形操作

重新应用之前撤销的变形状态。

#### Returns

`void`

#### Example

```typescript
// 基础用法
fabricWarpvas.redo();

// 配合快捷键使用
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'y') {
    fabricWarpvas.redo();
  }
});
```

#### Remarks

1. 如果重做栈为空，此操作无效
2. 重做操作本身不会产生新的历史记录
3. 执行新的变形操作会清空重做栈

#### See

undo 撤销操作

***

### render()

> **render**(`dirty`?, `options`?): `void`

渲染变形效果

将当前的变形状态渲染到画布上。

#### Parameters

##### dirty?

`boolean` = `true`

是否为脏渲染，脏渲染会导致 _dirtyRenderReturnCallback 回调执行

##### options?

`Partial`\<`RenderOptions`\> = `{}`

渲染配置选项

#### Returns

`void`

#### Example

```typescript
// 普通渲染（仅网格分割点位置变化）
fabricWarpvas.render(false);

// 脏渲染（网格结构发生变化，如添加或删除了分割点）
fabricWarpvas.render(true);

// 临时预览渲染（不记录历史）
fabricWarpvas.render(true, { skipHistoryRecording: true });
```

#### Remarks

1. 脏渲染会重建整个变形网格结构，性能消耗较大
2. 非脏渲染仅更新现有网格的控制点位置，性能消耗较小
3. 如果不需要记录历史，建议设置 skipHistoryRecording 为 true

#### See

requestRender 性能优化版本的渲染方法

***

### requestRender()

> **requestRender**(`dirty`?, `callback`?, `options`?): `void`

跟随浏览器绘制时机进行变形效果渲染

使用 requestAnimationFrame 延迟渲染到下一帧，可以：
1. 避免短时间内的重复渲染
2. 优化连续变形时的性能
3. 保持画面流畅度

#### Parameters

##### dirty?

`boolean` = `true`

是否为脏渲染，脏渲染会导致 _dirtyRenderReturnCallback 回调执行

##### callback?

() => `void`

渲染完成后的回调函数

##### options?

`Partial`\<`RenderOptions`\> = `{}`

渲染配置选项

#### Returns

`void`

#### Example

```typescript
// 基础用法
fabricWarpvas.requestRender();

// 带回调的用法，可保证渲染完成后再执行其他逻辑
fabricWarpvas.requestRender(true, () => {
  console.log('渲染完成');
});

// 连续变形时的优化用法
function onDragging() {
  fabricWarpvas.requestRender(false, null, {
    skipHistoryRecording: true // 拖拽过程中不记录历史
  });
}

function onDragEnd() {
  fabricWarpvas.render(true); // 拖拽结束时记录一次历史
}
```

#### Remarks

1. 此方法会自动取消上一次尚未执行的渲染请求
2. 适合用于处理连续的变形操作，如拖拽控制点
3. 对于关键状态的保存，建议使用同步的 render 方法

#### See

render 同步渲染方法

***

### reset()

> **reset**(`keepHistory`): `void`

重置变形状态

将图像重置到指定状态：
- 当 keepHistory=true 时：清除所有变形效果，但保留变形记录
- 当 keepHistory=false 时：回退到初始状态，清空变形记录

#### Parameters

##### keepHistory

`boolean` = `true`

是否保留历史记录
  - true: 清除变形但保留历史，可回到上一步状态
  - false: 回退到初始状态，并清空变形记录

#### Returns

`void`

#### Example

```typescript
// 1. 清除变形但保留历史记录
fabricWarpvas.reset(true);

// 2. 回退到初始状态，并清空变形记录
fabricWarpvas.reset(false);
```

#### Remarks

在以下情况下方法无效：
 - 当前不在变形状态（warpvas 为 null）
 - 当前已经是初始状态（keepHistory=true 时）

#### See

 - undo 单步撤销操作
 - redo 重做已撤销的操作
 - serialize 保存当前变形状态

***

### undo()

> **undo**(): `void`

撤销上一步变形操作

将变形状态回退到上一个记录点。

#### Returns

`void`

#### Example

```typescript
// 基础用法
fabricWarpvas.undo();

// 配合快捷键使用
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'z') {
    fabricWarpvas.undo();
  }
});
```

#### Remarks

1. 如果撤销栈为空或只有初始状态，此操作无效
2. 撤销操作本身不会产生新的历史记录

#### See

redo 重做已撤销的操作
