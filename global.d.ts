declare type Coord = { x: number; y: number };

declare type Position = { left: number; top: number };

declare type Matrix = [a: number, b: number, c: number, d: number, e: number, f: number];

declare type Constructor = abstract new (...args: any) => any;

declare type RGBA = { r: number; g: number; b: number; a?: number };

declare type Direction = 'top' | 'bottom' | 'left' | 'right';

declare type Transform = {
  translate: { x: number; y: number };
  rotate: number;
  scale: number | { x: number; y: number };
  skew: { x: number; y: number };
  flip: { x: boolean; y: boolean };
};

declare type Split<T> = {
  [K in keyof T]: { [P in K]: T[K] };
}[keyof T];

declare module '*.less' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.md' {
  const content: string;
  export default content;
}
