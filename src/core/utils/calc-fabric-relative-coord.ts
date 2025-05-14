import { FabricObject, Path, Point, util } from 'fabric/es';

/**
 * 计算某个点位相对于 Fabric.js 特定对象的坐标位置
 *
 * @param position - 要转换的位置
 *   @property {number} [left=0] - 相对于画布左边的距离
 *   @property {number} [top=0] - 相对于画布顶部的距离
 *
 * @param target - 目标 Fabric.js 对象
 *
 * @returns {Point} 转换后的相对坐标点
 */
export const calcFabricRelativeCoord = (
  position: { left?: number; top?: number },
  target: FabricObject,
) => {
  const { left = 0, top = 0 } = position;

  // 路径对象比较特殊，要处理自身偏移
  if (target.type === 'path') {
    const path = target as Path;

    // 计算路径的变换矩阵
    const pathMatrix = path.calcOwnMatrix();

    // 计算路径偏移量
    const offset = path.pathOffset.transform(pathMatrix, true);

    // 计算相对坐标点
    const point = new Point(left + offset.x, top + offset.y).transform(
      util.invertTransform(pathMatrix),
    );

    return point;
  }

  // 计算变换矩阵
  const matrix = target.calcOwnMatrix();

  // 计算相对坐标点
  const point = new Point(left, top).transform(util.invertTransform(matrix));

  return point;
};
