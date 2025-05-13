[**fabric-warpvas**](../../README.md)

***

# Class: `abstract` AbstractMode

变形模式的抽象基类

可具体实现该基类实现自定义变形模式

## Example

```typescript
// 实现一个自定义变形模式类
class CustomMode extends AbstractMode {
  // 第一步：自定义模式名称
  name = 'custom-mode';

  // 第二步：自定模式下的分割点计算策略，如果不覆盖默认的扭曲策略，可直接调用 super.execute 方法
  execute(warpvas: Warpvas) {
    return super.execute(warpvas);
  }

  // 第三步：覆盖默认的渲染时机钩子，该渲染方法会在 fabricWarpvas.render 执行后执行
  render(fabricWarpvas: FabricWarpvas) {
    // 这里保留默认逻辑（将临时变形图像添加到画布上）
    const cleanup = super.render(fabricWarpvas);

    // 添加自定义的交互元素，比如四个对角的交互点
    const customElement = new fabric.Rect({ ... });
    fabricWarpvas.canvas.add(customElement);

    // 返回清理回调
    return () => {
      // 移除添加的自定义交互元素
      fabricWarpvas.canvas.remove(customElement);
      // 执行默认逻辑的回调函数（移除临时变形图像）
      cleanup?.();
    };
  }

  // 第四步：具体实现脏渲染时机钩子，脏渲染逻辑仅在 fabricWarpvas.render 执行且 dirty 参数为 true 时执行
  dirtyRender() {
    // 返回清理回调
    return () => {};
  }
}
```

## Constructors

### new AbstractMode()

> **new AbstractMode**(): [`AbstractMode`](AbstractMode.md)

#### Returns

[`AbstractMode`](AbstractMode.md)

## Properties

### name

> `abstract` **name**: `string`

变形模式的标识名称，建议使用唯一标识，比如 'custom-mode'

## Methods

### dirtyRender()

> **dirtyRender**(`fabricWarpvas`): `void` \| () => `void`

在 fabricWarpvas.render 执行且 dirty 参数为 true 时执行的钩子函数

当变形区域结构发生变化时，dirty 参数为 true，但该参数也可由外部手动触发 render 传入

#### Parameters

##### fabricWarpvas

[`FabricWarpvas`](FabricWarpvas.md)

FabricWarpvas 实例

#### Returns

`void` \| () => `void`

返回清理回调函数，在下一次 fabricWarpvas.render 执行前执行

***

### execute()

> **execute**(`warpvas`): `Coord`[][][]

该模式计算变形区域分割点位置的策略方法，默认使用 warpvas 库的扭曲计算策略。

#### Parameters

##### warpvas

`Warpvas`

Warpvas 实例对象

#### Returns

`Coord`[][][]

返回计算后的分割点坐标数组

#### See

Warpvas 了解 warpvas.js 库

***

### render()

> **render**(`fabricWarpvas`): `void` \| () => `void`

在 fabricWarpvas.render 执行后执行的钩子函数

#### Parameters

##### fabricWarpvas

[`FabricWarpvas`](FabricWarpvas.md)

FabricWarpvas 实例对象

#### Returns

`void` \| () => `void`

返回清理回调函数，在下一次 fabricWarpvas.render 执行前执行
