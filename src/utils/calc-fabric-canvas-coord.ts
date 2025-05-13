import { Canvas, Point, StaticCanvas, util } from 'fabric/es';

/**
 * 将画布DOM坐标转换为 Fabric.js 画布坐标系中的坐标
 *
 * 在 Fabric.js 中，画布内容可能会被缩放、平移或变换，导致DOM坐标系和画布坐标系不一致。
 * 此函数用于将鼠标事件或触摸事件中的DOM坐标转换为 Fabric.js 画布内的相对坐标。
 *
 * @param canvas - Fabric.js 画布实例
 *
 * @param offset - DOM坐标点
 *   @property {number} x - 相对于画布 DOM 左边的x坐标
 *   @property {number} y - 相对于画布 DOM 顶部的y坐标
 *
 * @returns {Point} 转换后的画布坐标点
 */
export const calcFabricCanvasCoord = (canvas: Canvas | StaticCanvas, offset: Coord) => {
  const matrix = canvas.viewportTransform ?? [1, 0, 0, 1, 0, 0];
  return new Point(offset.x, offset.y).transform(util.invertTransform(matrix));
};
