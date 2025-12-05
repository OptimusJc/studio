
import type { Metadata } from 'next';
import { initializeFirebase } from '@/firebase/server-init'; // Use server initialization
import type { Product } from '@/types';

interface GenerateMetadataProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  db: 'retailers' | 'buyers';
}

/**
 * Generate metadata for product detail pages
 * @param props - Object containing params, searchParams, and db
 */
export async function generateMetadata(props: GenerateMetadataProps): Promise<Metadata> {
  const { params, searchParams, db } = props;
  const { id } = await params;
  const { firestore } = initializeFirebase();
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

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
    
    const rawImageUrl = productData.productImages?.[0];
    const proxiedImageUrl = rawImageUrl 
      ? `${baseUrl}/api/image-proxy?url=${encodeURIComponent(rawImageUrl)}` 
      : undefined;

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
        images: proxiedImageUrl ? [
          {
            url: proxiedImageUrl,
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
        images: proxiedImageUrl ? [proxiedImageUrl] : [],
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
