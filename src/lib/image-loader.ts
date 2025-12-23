// src/lib/image-loader.ts

type ImageLoaderProps = {
  src: string;
  width: number;
  quality?: number;
};

/**
 * A custom loader for Next.js Image component that serves images directly
 * from their source URL without any optimization. This is useful for bypassing
 * Vercel's image optimization limits and costs when using an external provider
 * like Firebase Storage.
 * @param {ImageLoaderProps} { src } - The source URL of the image.
 * @returns {string} The original source URL.
 */
export default function passthroughLoader({ src }: ImageLoaderProps): string {
  return src;
}
