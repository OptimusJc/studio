'use client';

/**
 * Custom Next.js Image Loader
 * Intercepts `<Image>` component requests and routes them to our custom
 * Sharp-powered Firebase function (the CDN) with width and quality params.
 */
export default function customImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const cdnBase = process.env.NEXT_PUBLIC_CDN_BASE_URL || 'https://cdn.rubycatalogue.co.ke/product-images';

  // If the image is served from our CDN function, attach resizing parameters.
  if (src.startsWith(cdnBase)) {
    // Next.js widths dynamically change based on srcset/sizes props
    return `${src}?w=${width}&q=${quality || 75}`;
  }

  // If not our CDN (e.g. legacy Firebase storage URLs, external domains), 
  // do not attempt to resize - return as-is.
  return src;
}
