/**
 * Resolves a stored image value to a full renderable URL.
 *
 * Handles two cases:
 *  1. New data model — stores only the filename, e.g. "1761812099179-photo.jpg"
 *     → constructs `${CDN_BASE}/${filename}`
 *  2. Legacy data — stores the full URL (firebasestorage or otherwise)
 *     → returned as-is for backward compatibility
 */
const CDN_BASE =
  process.env.NEXT_PUBLIC_CDN_BASE_URL ??
  'https://cdn.rubycatalogue.co.ke/product-images';

export function resolveImageUrl(value: string | undefined | null): string {
  if (!value) return 'https://placehold.co/600x600';
  // Already a full URL — legacy data, return unchanged
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  // Filename only — build CDN URL
  return `${CDN_BASE}/${value}`;
}
