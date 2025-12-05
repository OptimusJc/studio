
import * as React from "react";
import { Suspense } from "react";
import { ProductDetailPageClient } from "@/app/retailer-catalog/components/ProductDetailClient";
import { Skeleton } from "@/components/ui/skeleton";
import ProductDetailHeader from "@/app/retailer-catalog/components/ProductDetailHeader";
import { generateMetadata as generateProductMetadataAlias } from '@/lib/metadata';
import { initializeFirebase } from '@/firebase/server-init';
import { DocumentData } from 'firebase/firestore';
import type { Product } from '@/types';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(props: PageProps) {
  return generateProductMetadataAlias({ ...props, db: 'buyers' });
}

async function getProductAndRelated(productId: string) {
    const { firestore } = initializeFirebase();

    const knownCategories = ['wallpapers', 'window-blinds', 'wall-murals', 'carpets', 'window-films', 'fluted-panels'];
    const searchPaths = [
        `drafts/${productId}`,
        ...knownCategories.flatMap(cat => [`retailers/${cat}/products/${productId}`, `buyers/${cat}/products/${productId}`])
    ];

    const fetchPromises = searchPaths.map(path => firestore.doc(path).get());
    const results = await Promise.allSettled(fetchPromises);
    
    let foundProduct: Product | null = null;
    let foundDb: 'retailers' | 'buyers' | null = null;
    let foundCategorySlug: string | null = null;

    for (const result of results) {
        if (result.status === 'fulfilled' && result.value.exists) {
            const snapshot = result.value;
            const data = snapshot.data() as DocumentData;
            const pathSegments = snapshot.ref.path.split('/');

            if (pathSegments[0] === 'drafts') {
                foundDb = data.db;
                foundCategorySlug = data.category;
            } else {
                foundDb = pathSegments[0] as 'retailers' | 'buyers';
                foundCategorySlug = pathSegments[1];
            }

            if (data.status === 'Published' || pathSegments[0] === 'drafts') {
                foundProduct = {
                    id: snapshot.id,
                    ...data,
                    name: data.productTitle,
                    imageUrl: data.productImages?.[0] || 'https://placehold.co/600x600',
                    db: foundDb,
                    category: foundCategorySlug,
                } as Product;
                break;
            }
        }
    }
    
    if (!foundProduct) {
        return { product: null, relatedProducts: [] };
    }

    let relatedProducts: Product[] = [];
    if (foundCategorySlug && foundDb) {
        const relatedCollectionPath = `${foundDb}/${foundCategorySlug}/products`;
        const q = firestore.collection(relatedCollectionPath).where("status", "==", "Published").limit(7);
        try {
            const querySnapshot = await q.get();
            querySnapshot.forEach((doc) => {
                if (doc.id !== productId) {
                    const data = doc.data() as DocumentData;
                    relatedProducts.push({
                        id: doc.id,
                        ...data,
                        name: data.productTitle,
                        imageUrl: data.productImages?.[0] || 'https://placehold.co/600x600',
                        category: foundCategorySlug,
                        db: foundDb,
                    } as Product);
                }
            });
        } catch (e) {
            console.warn(`Could not fetch related products from ${relatedCollectionPath}`, e);
        }
    }

    return { product: foundProduct, relatedProducts: relatedProducts.slice(0, 6) };
}

function ProductDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="grid grid-cols-5 gap-3">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="aspect-square w-full rounded-lg" />
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-20 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-5 w-24" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-5 w-24" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
          <Skeleton className="h-12 w-48" />
        </div>
      </div>
      <div className="mt-16">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { product, relatedProducts } = await getProductAndRelated(id);

  return (
    <div className="bg-muted/40 min-h-screen">
      <ProductDetailHeader basePath="/shop" />
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetailPageClient product={product} relatedProducts={relatedProducts} />
      </Suspense>
    </div>
  );
}
