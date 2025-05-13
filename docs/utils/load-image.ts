export const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve) => {
    const image = new Image();
    image.onload = async () => {
      resolve(image);
    };
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
