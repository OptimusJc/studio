// @ts-nocheck
// Disabling TypeScript check for this file because the loader function signature
// is defined by Next.js and may not perfectly align with standard TS definitions
// in all project configurations.

/**
 * Custom image loader for Next.js to serve images directly from Google Cloud Storage.
 * This function constructs a public URL for a GCS object.
 * It assumes the source URL is a Firebase Storage URL and converts it.
 *
 * @param {object} props - The properties passed by the next/image component.
 * @param {string} props.src - The original image source URL from Firebase Storage.
 * @returns {string} The direct, public URL to the image in Google Cloud Storage.
 */
export default function googleStorageLoader({ src }) {
  // This loader serves the original image without resizing, so it ignores `width` and `quality`.
  // This is suitable for bypassing Vercel's image optimization and serving directly from GCS.

  // It's a good practice to handle non-Firebase URLs gracefully.
  if (!src.includes('firebasestorage.googleapis.com')) {
    return src;
  }

  try {
    const url = new URL(src);
    // Pathname is like: /v0/b/your-bucket.appspot.com/o/path%2Fto%2Fimage.jpg
    const pathName = url.pathname;
    const parts = pathName.split('/o/');

    if (parts.length < 2) {
      // Return original URL if format is unexpected
      return src;
    }

    // Extract bucket name (e.g., 'your-bucket.appspot.com')
    const bucket = parts[0].replace('/v0/b/', '');

    // Extract and decode the object path (e.g., 'path/to/image.jpg')
    const objectPath = decodeURIComponent(parts[1]);

    // Construct the public GCS URL
    return `https://storage.googleapis.com/${bucket}/${objectPath}`;
  } catch (error) {
    console.error('Error in custom image loader:', error);
    // Fallback to the original src if URL parsing fails
    return src;
  }
}
