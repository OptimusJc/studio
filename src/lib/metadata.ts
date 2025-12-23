
import { Metadata } from 'next';
import { initializeFirebase } from '@/firebase/server-init';
import { getDocs, query, collection, where, limit, DocumentData, doc, getDoc } from 'firebase/firestore';
import type { Product, Category } from '@/types';
import { getPublicUrl } from './storage-utils';

type GenerateMetadataProps = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

/*
 Note: The 'db' parameter is added here for convenience but is not a standard
 part of Next.js's generateMetadata props. We pass it manually from the page.
*/
export async function generateProductMetadata({ params, db }: GenerateMetadataProps & { db: 'retailers' | 'buyers' }): Promise<Metadata> {
  const { id } = params;
  const { firestore } = initializeFirebase();
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://localhost:9002`

  try {
    const categoriesCollection = collection(firestore, 'categories');
    const categoriesSnapshot = await getDocs(categoriesCollection);
    const categories: Category[] = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));

    let product: Product | null = null;
    let productCategoryName: string | null = null;

    for (const cat of categories) {
      const categorySlug = cat.name.toLowerCase().replace(/\s+/g, "-");
      const collectionPath = `${db}/${categorySlug}/products`;
      
      const productRef = doc(firestore, collectionPath, id);
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {
        const data = productSnap.data() as DocumentData;
        if (data.status === "Published") {
          product = {
            id: productSnap.id,
            ...data,
            name: data.productTitle,
            imageUrl: data.productImages?.[0] || '',
            category: cat.name,
            db: db
          } as Product;
          break;
        }
      }
    }

    if (!product) {
      return {
        title: 'Product Not Found',
        description: 'The requested product could not be found.',
      };
    }
    
    const proxiedImageUrl = `${baseUrl}/api/image-proxy?url=${encodeURIComponent(product.imageUrl)}`;

    return {
      title: `${product.productTitle || product.name} | Ruby`,
      description: product.productDescription || `Details for ${product.productTitle || product.name}.`,
      openGraph: {
        title: product.productTitle || product.name,
        description: product.productDescription || '',
        images: [
          {
            url: proxiedImageUrl,
            width: 1200,
            height: 630,
            alt: product.productTitle || product.name,
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: product.productTitle || product.name,
        description: product.productDescription || '',
        images: [proxiedImageUrl],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Error',
      description: 'Could not load product details.',
    };
  }
}
