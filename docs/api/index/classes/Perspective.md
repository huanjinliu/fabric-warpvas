[**fabric-warpvas**](../../README.md)

***

# Class: Perspective

透视变形模式

提供图像的透视变形功能，通过四个对角控制点实现自由透视效果。

交互说明：
1. 拖动控制点实现透视的变换（PS：形成三角形后无法进一步透视变换）
2. 空白区域持续拖拽形成整体变形（当 enableDragResize 为 true 时生效）
3. 按住设置按键限制控制点拖动只向水平或垂直方向移动（当 enableConstraintKey 设置为具体按键时生效）

## Example

```typescript
import { fabric } from 'fabric';
import { FabricWarpvas } from 'fabric-warpvas';
import Perspective from 'fabric-warpvas/modes/perspective';

// 创建 fabricWarpvas 实例
const canvas = new fabric.Canvas('canvas');
const fabricWarpvas = new FabricWarpvas(canvas);

// 创建透视模式
const perspective = new Perspective({ themeColor: '#FF0000' });  // 交互元素使用红色主题色

// 自定义模式中的控制点样式
perspective.registerStyleSetter('control', (control) => {
    control.set({
      radius: 10,
      fill: 'blue',
      stroke: 'white'
    });
    return control;
});

// 进入变形态
fabricWarpvas.enterEditing(image, null, perspective);
```

## Remarks

使用注意：四个对角控制点形成三角形后无法进一步拖拽，这会导致无效的透视效果

## Extends

- `BaseMode`\<\{ `control`: (`object`) => `FabricObject`; \}, `PerspectiveOptions`\>

## Constructors

### new Perspective()

> **new Perspective**(`options`): [`Perspective`](Perspective.md)

创建透视变形模式实例

初始化一个透视变形模式。

#### Parameters

##### options

`Partial`\<`PerspectiveOptions`\> = `{}`

#### Returns

[`Perspective`](Perspective.md)

#### Overrides

`BaseMode< { /** * 配置对角控制点样式回调 * @param object - 默认的控制点对象 * @returns 作为控制点对象的fabric元素对象，可使用默认对象以外的新对象 */ control: (object: FabricObject) => FabricObject; }, PerspectiveOptions >.constructor`

## Properties

### name

> **name**: `string` = `'perspective'`

变形模式的唯一标识名称

#### Overrides

`BaseMode.name`

***

### options

> **options**: `Required`\<`PerspectiveOptions`\>

模式配置

#### Overrides

`BaseMode.options`

## Accessors

### controlObjects

#### Get Signature

> **get** **controlObjects**(): `FabricObject`\<`Partial`\<`FabricObjectProps`\>, `SerializedObjectProps`, `ObjectEvents`\>[]

获取当前所有的控制点对象

返回当前透视变形模式中的所有控制点对象。

##### Example

```typescript
// 1.隐藏所有控制点
perspective.controlObjects.forEach(control => {
  control.set({ visible: false });
});
canvas.renderAll();

// 2.将所有控制点移到最上层
perspective.controlObjects.forEach(control => {
  canvas.bringObjectToFront(control);
});
```

##### Returns

`FabricObject`\<`Partial`\<`FabricObjectProps`\>, `SerializedObjectProps`, `ObjectEvents`\>[]

返回所有控制点对象的数组

## Methods

### dirtyRender()

> **dirtyRender**(`fabricWarpvas`): `undefined` \| () => `void`

在脏渲染后执行的钩子，用于渲染透视变形的交互元素

#### Parameters

##### fabricWarpvas

[`FabricWarpvas`](FabricWarpvas.md)

FabricWarpvas 实例，提供操作接口

#### Returns

`undefined` \| () => `void`

返回清理函数，用于移除所有控制点和事件监听器

#### Example

```typescript
// 进入交互会自动调用
const cleanup = perspective.dirtyRender(fabricWarpvas);

// 退出交互时清理
cleanup();
```

#### Remarks

无效的透视变形会自动回退到上一个有效状态

#### Overrides

`BaseMode.dirtyRender`

***

### execute()

> **execute**(`warpvas`): `Coord`[][][]

执行透视变形计算

代理方法，调用静态方法 [Perspective.execute](Perspective.md#execute-2) 进行实际的透视变形计算。

#### Parameters

##### warpvas

`Warpvas`

需要进行透视变形的贴图对象

#### Returns

`Coord`[][][]

返回计算后的网格分割点坐标数组

#### See

[Perspective.execute](Perspective.md#execute-2) 具体实现细节

#### Overrides

`BaseMode.execute`

***

### registerStyleSetter()

> **registerStyleSetter**\<`K`\>(`label`, `setter`): `void`

注册样式设置器，自定义变形模式中各种元素的外观，如果模式类并未对外提供设置入口，那便意味无法实现自定义修改

#### Type Parameters

• **K** *extends* `"control"`

样式设置器的标签类型，必须是 T 中定义的键之一

#### Parameters

##### label

`K`

样式设置器的标签，用于标识要设置的元素

##### setter

`object`\[`K`\]

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

[`FabricWarpvas`](FabricWarpvas.md)

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

计算透视变形的网格分割点

该方法实现了透视变形的核心算法，依赖于 warpvas-perspective 库。

#### Parameters

##### warpvas

`Warpvas`

需要进行透视变形的贴图对象

#### Returns

`Coord`[][][]

返回三维数组，表示网格的分割点坐标：
- 第一维：行索引
- 第二维：列索引
- 第三维：点的坐标 {x, y}

#### Throws

当四个顶点形成无效的透视形状时抛出错误

#### Remarks

1. 顶点的移动范围会受到透视有效性的限制
2. 当线条平行时会使用默认点代替交点
