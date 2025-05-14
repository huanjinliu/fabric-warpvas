import type { BasicTransformEvent, Canvas, FabricObject, TPointerEvent } from 'fabric/es';

/**
 * 注册按键限制元素移动
 *
 * @param fabricCanvas fabric 画布对象
 * @param key 按键 key 值，不区分大小写
 *
 * @returns 注销回调
 */
export const registerLimitMoveEvent = (fabricCanvas: Canvas, key: string) => () => {
  // 记录按下状态
  let press = false;
  const handleKeyDown = (e: KeyboardEvent) => {
    press = e.key.toUpperCase() === key.toUpperCase();
  };
  const handleKeyUp = (e: KeyboardEvent) => {
    press = e.key.toUpperCase() === key.toUpperCase();
  };
  // 元素移动时按键添加移动限制
  const handleMovingLimit = (
    e: BasicTransformEvent<TPointerEvent> & {
      target: FabricObject;
    },
  ) => {
    if (press && e.target && e.transform) {
      const { left: newLeft = 0, top: newTop = 0 } = e.target;
      const { left, top } = e.transform.original;
      const deltaX = Math.abs(newLeft - left);
      const deltaY = Math.abs(newTop - top);
      if (deltaX > deltaY) {
        e.target.set({ top }).setCoords();
      } else {
        e.target.set({ left }).setCoords();
      }
    }
  };
  fabricCanvas.on('object:moving', handleMovingLimit);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  return () => {
    fabricCanvas.off('object:moving', handleMovingLimit);
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  };
};
