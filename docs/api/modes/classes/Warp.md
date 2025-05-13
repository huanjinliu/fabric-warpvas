[**fabric-warpvas**](../../README.md)

***

# Class: Warp

扭曲变形模式类

提供图像的扭曲变形功能。

交互说明：
1. 拖动交互点实现扭曲点的变换，支持框选
2. 点击内部区域，会出现临时交互点
3. 拖动临时交互点实现整体移动
4. 点击临时交互点实现变形区域分割
5. 选中交互点后点击Delete实现扭曲点的删除（PS：四个原始对角交互点无法被删除）
6. 按住设置按键限制控制点拖动只向水平或垂直方向移动（当 enableConstraintKey 设置为具体按键时生效）

## Example

```typescript
import { fabric } from 'fabric';
import { FabricWarpvas } from 'fabric-warpvas';
import Warp from 'fabric-warpvas/modes/warp';

// 创建 fabricWarpvas 实例
const canvas = new fabric.Canvas('canvas');
const fabricWarpvas = new FabricWarpvas(canvas);

// 创建扭曲模式
const warp = new Warp({ themeColor: '#FF0000' });  // 交互元素使用红色主题色

// 自定义模式中的控制点样式
warp.registerStyleSetter('control', (control) => {
    control.set({
      radius: 10,
      fill: 'blue',
      stroke: 'white'
    });
    return control;
});

// 进入变形态
fabricWarpvas.enterEditing(image, null, warp);
```

## Remarks

原始对象默认保持可见，需要手动隐藏

## See

- BaseMode 变形模式基类
- [FabricWarpvas](../../index/classes/FabricWarpvas.md) 主要功能类

## Extends

- `BaseMode`\<`WarpObjects`, `WarpOptions`\>

## Constructors

### new Warp()

> **new Warp**(`options`): [`Warp`](Warp.md)

创建扭曲变形模式实例

初始化一个新的扭曲变形模式。

#### Parameters

##### options

`Partial`\<`WarpOptions`\> = `{}`

#### Returns

[`Warp`](Warp.md)

#### Overrides

`BaseMode<WarpObjects, WarpOptions>.constructor`

## Properties

### name

> **name**: `string` = `'warp'`

变形模式的唯一标识名称

#### Overrides

`BaseMode.name`

***

### options

> **options**: `Required`\<`WarpOptions`\>

模式配置

#### Overrides

`BaseMode.options`

## Accessors

### controlObjects

#### Get Signature

> **get** **controlObjects**(): `FabricObject`\<`Partial`\<`FabricObjectProps`\>, `SerializedObjectProps`, `ObjectEvents`\>[]

获取所有顶点控制点

返回所有用于控制贴图顶点的主控制点对象列表。
这些控制点位于贴图的四个角和边缘分割点位置。

##### Returns

`FabricObject`\<`Partial`\<`FabricObjectProps`\>, `SerializedObjectProps`, `ObjectEvents`\>[]

顶点控制点对象数组

***

### insertControlObject

#### Get Signature

> **get** **insertControlObject**(): `null` \| `FabricObject`\<`Partial`\<`FabricObjectProps`\>, `SerializedObjectProps`, `ObjectEvents`\>

获取当前激活的插入控制点

返回当前正在交互的插入点对象。
当用户点击贴图内部时会创建此控制点，
用户可以通过点击它来在该位置添加新的分割点。

##### Returns

`null` \| `FabricObject`\<`Partial`\<`FabricObjectProps`\>, `SerializedObjectProps`, `ObjectEvents`\>

插入控制点对象，如果不存在则返回 null

***

### lineObjects

#### Get Signature

> **get** **lineObjects**(): `Line`\<`Partial`\<`FabricObjectProps`\>, `SerializedLineProps`, `ObjectEvents`\>[]

获取所有控制点连接线

返回所有连接主控制点和曲线控制点的线段对象列表。
这些线段用于可视化控制点之间的关系。

##### Returns

`Line`\<`Partial`\<`FabricObjectProps`\>, `SerializedLineProps`, `ObjectEvents`\>[]

连接线对象数组

***

### subControlObjects

#### Get Signature

> **get** **subControlObjects**(): `FabricObject`\<`Partial`\<`FabricObjectProps`\>, `SerializedObjectProps`, `ObjectEvents`\>[]

获取所有曲线控制点

返回所有用于调整曲线形状的次要控制点对象列表。
这些控制点位于边缘曲线的中间位置，用于调整曲线的弯曲程度。

##### Returns

`FabricObject`\<`Partial`\<`FabricObjectProps`\>, `SerializedObjectProps`, `ObjectEvents`\>[]

曲线控制点对象数组

## Methods

### dirtyRender()

> **dirtyRender**(`fabricWarpvas`): `undefined` \| () => `void`

在脏渲染后执行的钩子，用于渲染变形的交互元素

#### Parameters

##### fabricWarpvas

[`FabricWarpvas`](../../index/classes/FabricWarpvas.md)

FabricWarpvas 实例，提供操作接口

#### Returns

`undefined` \| () => `void`

清理函数，用于移除所有控制元素和事件监听

#### Example

```typescript
// 进入交互会自动调用
const cleanup = warp.dirtyRender(fabricWarpvas);

// 退出交互时清理
cleanup();
```

#### Overrides

`BaseMode.dirtyRender`

***

### execute()

> **execute**(`warpvas`): `Coord`[][][]

执行扭曲变形计算

代理方法，调用静态方法 [Warp.execute](Warp.md#execute-2) 进行实际的扭曲变形计算。

#### Parameters

##### warpvas

`Warpvas`

需要进行扭曲变形的贴图对象

#### Returns

`Coord`[][][]

返回计算后的网格分割点坐标数组

#### See

[Warp.execute](Warp.md#execute-2) 具体实现细节

#### Overrides

`BaseMode.execute`

***

### registerStyleSetter()

> **registerStyleSetter**\<`K`\>(`label`, `setter`): `void`

注册样式设置器，自定义变形模式中各种元素的外观，如果模式类并未对外提供设置入口，那便意味无法实现自定义修改

#### Type Parameters

• **K** *extends* keyof `WarpObjects`

样式设置器的标签类型，必须是 T 中定义的键之一

#### Parameters

##### label

`K`

样式设置器的标签，用于标识要设置的元素

##### setter

`WarpObjects`\[`K`\]

样式设置器的回调函数，用于设置元素的样式

#### Returns

`void`

#### Example

```typescript
// 进入变形模式的图像样式设置 80% 不透明度
mode.registerStyleSetter('image', (image) => {
  image.set({ opacity: 0.8 });
});
```

#### Remarks

1. 新的样式设置会与现有设置合并，而不是完全替换
2. 对于同名设置器，新的会覆盖旧的
3. 样式会在下一次渲染时生效

#### Inherited from

`BaseMode.registerStyleSetter`

***

### render()

> **render**(`fabricWarpvas`): `undefined` \| () => `void`

渲染变形效果到画布

将变形后的贴图和网格边界线渲染到 Fabric.js 画布上。

#### Parameters

##### fabricWarpvas

[`FabricWarpvas`](../../index/classes/FabricWarpvas.md)

Fabric 变形工具实例，包含画布和变形状态

#### Returns

`undefined` \| () => `void`

清理函数，用于移除渲染的元素

#### Example

```typescript
class CustomMode extends BaseMode {
  render(fabricWarpvas: FabricWarpvas) {
    // 调用基类渲染方法
    const cleanup = super.render(fabricWarpvas);

    // 添加自定义渲染逻辑
    const customElements = this.renderCustomElements();

    // 返回组合的清理函数
    return () => {
      cleanup();
      this.cleanupCustomElements(customElements);
    };
  }
}
```

#### Remarks

1. 返回的清理函数会在下次渲染前或离开编辑模式时自动调用
2. 子类可以通过 super.render() 复用基类的渲染逻辑
3. 渲染的元素样式可通过 registerStyleSetters 配置

#### Inherited from

`BaseMode.render`

***

### execute()

> `static` **execute**(`warpvas`): `Coord`[][][]

计算贴图的分割点坐标

根据贴图的网格曲线计算分割点的位置坐标。该方法会：
1. 遍历所有网格单元
2. 计算横向和纵向曲线的交点
3. 生成用于变形的控制点网格

#### Parameters

##### warpvas

`Warpvas`

需要进行变形的贴图对象

#### Returns

`Coord`[][][]

返回三维数组：
- 第一维：行索引
- 第二维：列索引
- 第三维：分割点坐标 {x, y}
