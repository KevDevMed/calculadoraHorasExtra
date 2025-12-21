declare module 'html-to-image' {
  export interface Options {
    cacheBust?: boolean;
    pixelRatio?: number;
    backgroundColor?: string;
    width?: number;
    height?: number;
    style?: Record<string, string>;
  }

  export function toPng(node: HTMLElement, options?: Options): Promise<string>;
}
