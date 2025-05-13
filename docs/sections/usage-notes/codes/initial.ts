import { Canvas } from 'fabric/es';

// 创建 fabric 画布对象
const element = document.createElement('canvas');
const canvas = new Canvas(element);

// 取消当前元素选中
canvas.discardActiveObject();
// 画布渲染不跳过离屏元素（避免元素无法显示）
canvas.skipOffscreen = false;
// 允许画布多选（实现多交互点选中）
canvas.selection = true;
// 保持选中元素的层级关系（避免交互点层级混乱）
canvas.preserveObjectStacking = true;
// 取消画布遮罩（避免交互点不可视）
canvas.clipPath = undefined;
// 移除目标元素（避免元素重叠）

// ...等等，请根据实际情况配置，同时注意离开变形时是否要恢复配置
