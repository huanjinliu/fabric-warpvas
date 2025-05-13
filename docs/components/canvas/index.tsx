import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import classnames from 'classnames';
import { Canvas, TMat2D } from 'fabric/es';
import throttle from 'lodash-es/throttle';
import styles from './style.less';

interface CanvasProps {
  className?: string;
  children?: React.ReactNode;
}

export interface CanvasHandlers {
  getCanvas: () => Canvas | null;
}

const XCanvas = forwardRef<CanvasHandlers, CanvasProps>(({ className, children }, ref) => {
  const _canvasRef = useRef<HTMLCanvasElement>(null);
  const _fabricCanvasRef = useRef<Canvas>();

  useImperativeHandle(ref, () => ({
    getCanvas: () => {
      const canvas = _fabricCanvasRef.current ?? null;
      if (canvas) canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      return canvas;
    },
  }));

  useEffect(() => {
    const canvas = _canvasRef.current;
    if (!canvas) return;

    const parentNode = canvas.parentNode as HTMLDivElement;
    const fabricCanvas = new Canvas(canvas, {
      width: parentNode.clientWidth,
      height: parentNode.clientHeight,
      selectionColor: 'rgba(180, 180, 180, 0.2)',
    });
    _fabricCanvasRef.current = fabricCanvas;

    // 如果支持 ResizeObserver ，尺寸更新适配画布尺寸
    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== undefined) {
      observer = new ResizeObserver(
        throttle(
          (entries) => {
            const target = entries[0].target;
            if (!target) return;

            const { clientWidth: newWidth, clientHeight: newHeight } = target;
            const { width = 0, height = 0 } = fabricCanvas;
            if (newWidth === width && newHeight === height) return;

            fabricCanvas.setDimensions({ width: newWidth, height: newHeight });

            const matrix = fabricCanvas.viewportTransform;
            if (matrix) {
              fabricCanvas.setViewportTransform([
                ...matrix.slice(0, 4),
                matrix[4] + (newWidth - width) / 2,
                matrix[5] + (newHeight - height) / 2,
              ] as TMat2D);
            }
            fabricCanvas.renderAll();
          },
          15,
          {
            leading: true,
            trailing: true,
          },
        ),
      );
      observer.observe(parentNode);
    }

    return () => {
      if (observer) observer.disconnect();
      fabricCanvas.dispose();
    };
  }, []);

  return (
    <div className={classnames(styles.canvas, className)}>
      <canvas ref={_canvasRef}></canvas>
      {children}
    </div>
  );
});

export default XCanvas;
