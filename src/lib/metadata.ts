
import type { Metadata } from 'next';
import { initializeFirebase } from '@/firebase/server-init'; // Use server initialization
import type { Product } from '@/types';

interface GenerateMetadataProps {
  params: { id: string };
  db: 'retailers' | 'buyers';
}

/**
 * Transforms a Firebase Storage URL into a direct, public URL.
 * e.g., "https://firebasestorage.googleapis.com/v0/b/bucket/o/file.jpg?alt=media&token=..."
 * becomes "https://storage.googleapis.com/bucket/file.jpg"
 * @param url The original Firebase Storage URL.
 * @returns The clean, public URL.
 */
function getCleanFirebaseUrl(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    const urlObject = new URL(url);
    const path = urlObject.pathname;

    // Pathname looks like: /v0/b/YOUR_BUCKET_NAME/o/your/file/path.jpg
    const parts = path.split('/');
    if (parts.length < 5 || parts[1] !== 'v0' || parts[2] !== 'b' || parts[4] !== 'o') {
      // Not a standard Firebase Storage URL, return it as is.
      return url;
    }

    const bucketName = parts[3];
    const objectPath = parts.slice(5).join('/');

    // The object path is URL-encoded, so we need to decode it.
    const decodedObjectPath = decodeURIComponent(objectPath);
    
    return `https://storage.googleapis.com/${bucketName}/${decodedObjectPath}`;

  } catch (error) {
    console.error("Failed to parse Firebase URL:", error);
    return url; // Return original URL if parsing fails
  }
}


/**
 * Generate metadata for product detail pages
 * @param params - Route parameters
 * @param db - Database to search in ('retailers' or 'buyers')
 */
export async function generateMetadata({ params, db }: GenerateMetadataProps): Promise<Metadata> {
  const { id } = params;
  const { firestore } = initializeFirebase();

  try {
    const categoriesSnapshot = await firestore.collection('categories').get();
    
    if (categoriesSnapshot.empty) {
      return {
        title: 'Product Not Found',
        description: 'The requested product could not be found.',
      };
    }

    let productData: Product | null = null;

    for (const categoryDoc of categoriesSnapshot.docs) {
      const category = categoryDoc.data();
      const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-');
      const collectionPath = `${db}/${categorySlug}/products`;
      
      try {
        const productDocRef = firestore.collection(collectionPath).doc(id);
        const productDoc = await productDocRef.get();
        
        if (productDoc.exists) {
          const data = productDoc.data();
          if (data && data.status === 'Published') {
            productData = data as Product;
            break;
          }
        }
      } catch (error) {
        continue;
      }
    }

    if (!productData) {
      const draftDocRef = firestore.collection('drafts').doc(id);
      const draftDoc = await draftDocRef.get();
      if (draftDoc.exists) {
        productData = draftDoc.data() as Product;
      }
    }

    if (!productData) {
      return {
        title: 'Product Not Found',
        description: 'This product may have been moved or deleted.',
      };
    }

    const title = `${productData.productCode || ''} - ${productData.productTitle}`.trim();
    const description = productData.productDescription || `View details for ${productData.productTitle}`;
    const cleanImageUrl = getCleanFirebaseUrl(productData.productImages?.[0]);
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const productUrl = `${baseUrl}/${db === 'retailers' ? 'retailer-catalog' : 'shop'}/${id}`;

    return {
      title,
      description,
      openGraph: {
        title: productData.productTitle,
        description,
        url: productUrl,
        siteName: 'Ruby Trading',
        type: 'website',
        images: cleanImageUrl ? [
          {
            url: cleanImageUrl, // Use the direct URL
            width: 1200,
            height: 630,
            alt: productData.productTitle,
          }
        ] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: productData.productTitle,
        description,
        images: cleanImageUrl ? [cleanImageUrl] : [],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Error',
      description: 'An error occurred while loading the product.',
    };
  }
}
