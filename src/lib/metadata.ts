
import { initializeFirebase } from '@/firebase/server-init';
import type { Metadata } from 'next';
import type { Product } from '@/types';

type GenerateMetadataProps = {
  params: Promise<{ id: string }>;
  db: 'retailers' | 'buyers';
};

/**
 * Generates metadata for a product page.
 * Fetches product data to populate title, description, and openGraph images.
 */
export async function generateMetadata({ params, db }: GenerateMetadataProps): Promise<Metadata> {
  const { id } = await params;
  const { firestore } = initializeFirebase();

  try {
    // To find the product, we need to search across all category subcollections.
    // First, get all categories.
    const categoriesSnapshot = await firestore.collection('categories').get();
    if (categoriesSnapshot.empty) {
      // No categories, so we can't find the product.
      return {
        title: 'Product Not Found',
        description: 'The requested product could not be found.',
      };
    }

    let productData: Product | null = null;
    let productCategory: string | null = null;

    for (const categoryDoc of categoriesSnapshot.docs) {
      const category = categoryDoc.data();
      const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-');
      const productDocRef = firestore.collection(`${db}/${categorySlug}/products`).doc(id);
      const productDoc = await productDocRef.get();

      if (productDoc.exists) { 
        productData = productDoc.data() as Product;
        productCategory = category.name;
        break; // Found it
      }
    }
    
    // Also check drafts, just in case
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

    const title = `${productData.productTitle || 'Product'} | ${productCategory || 'Catalog'}`;
    const description = productData.productDescription || 'View product details.';
    const imageUrl = productData.productImages?.[0];

    // The metadataBase in the root layout will turn this into an absolute URL.
    const proxyImageUrl = imageUrl ? `/api/image-proxy?url=${encodeURIComponent(imageUrl)}` : undefined;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: proxyImageUrl ? [{ url: proxyImageUrl }] : [],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Error',
      description: 'There was an error loading product information.',
    };
  }
}
