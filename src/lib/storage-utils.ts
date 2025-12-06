
'use client';

/**
 * Converts a Firebase Storage URL into a public, "CDN-style" URL
 * that is more compatible with social media link scrapers like WhatsApp.
 *
 * @param firebaseUrl The original Firebase Storage URL (e.g., from getDownloadURL).
 * @returns A public URL in the format: https://storage.googleapis.com/BUCKET_NAME/OBJECT_PATH
 */
export function getPublicUrl(firebaseUrl: string | undefined): string | null {
  if (!firebaseUrl) {
    return null;
  }

  try {
    const url = new URL(firebaseUrl);
    // The pathname is in the format /v0/b/BUCKET_NAME/o/OBJECT_PATH
    const pathSegments = url.pathname.split('/');
    
    // Ensure the URL is in the expected format
    if (pathSegments.length < 5 || pathSegments[1] !== 'v0' || pathSegments[2] !== 'b') {
      // If it doesn't match, it might be a different URL format, return it as is.
      return firebaseUrl.split('?')[0];
    }
    
    // The bucket name is the 4th segment. The full hostname is not the bucket name.
    const bucket = pathSegments[3]; 
    const objectPath = pathSegments.slice(5).join('/');

    // The object path is URL-encoded, so we decode it.
    const decodedObjectPath = decodeURIComponent(objectPath);
    
    return `https://storage.googleapis.com/${bucket}/${decodedObjectPath}`;

  } catch (error) {
    console.error("Error creating public URL:", error);
    // Fallback to removing query parameters if URL parsing fails
    return firebaseUrl.split('?')[0];
  }
}
