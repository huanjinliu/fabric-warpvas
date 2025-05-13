export const canvasToURL = async (canvas: HTMLCanvasElement) =>
  new Promise<string>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        resolve(url);
      }
    });
  });
