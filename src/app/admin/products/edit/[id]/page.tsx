
'use client';
import { PageHeader } from '../../../components/PageHeader';
import { ProductForm } from '../../components/ProductForm';
import { useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, getDoc } from 'firebase/firestore';
import { useParams, useSearchParams } from 'next/navigation';
import type { Product, Attribute, Category } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useMemo, useState } from 'react';

function EditProductFormSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
             <Skeleton className="h-96 w-full" />
             <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-8">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
    )
}

function createSafeSlug(name: string) {
    if (!name) return '';
    return name
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with a single one
}

export default function EditProductPage() {
  const firestore = useFirestore();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const productId = params.id as string;
  const dbFromUrl = (searchParams.get('db') as 'retailers' | 'buyers') || 'retailers';
  const categorySlugFromUrl = searchParams.get('category');
  
  const [productData, setProductData] = useState<any | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);

  const attributesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'attributes');
  }, [firestore]);
  const { data: attributes, isLoading: isLoadingAttributes } = useCollection<Attribute>(attributesCollection);

  const categoriesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesCollection);

  const isLoading = isLoadingProduct || isLoadingAttributes || isLoadingCategories;
  
  useEffect(() => {
    const findProduct = async () => {
        if (!firestore || !productId || !categories) return;
        setIsLoadingProduct(true);

        // 1. Check drafts first
        const draftRef = doc(firestore, 'drafts', productId);
        const draftSnap = await getDoc(draftRef);
        if (draftSnap.exists()) {
            setProductData({ ...draftSnap.data(), id: draftSnap.id });
            setIsLoadingProduct(false);
            return;
        }

        // 2. If not in drafts, search all published collections
        for (const db of ['retailers', 'buyers']) {
            for (const cat of categories) {
                const categorySlug = createSafeSlug(cat.name);
                const liveCollectionPath = `${db}/${categorySlug}/products`;
                const productRef = doc(firestore, liveCollectionPath, productId);
                const productSnap = await getDoc(productRef);
                if (productSnap.exists()) {
                    setProductData({ 
                        ...productSnap.data(), 
                        id: productSnap.id,
                    });
                    setIsLoadingProduct(false);
                    return;
                }
            }
        }

        // 3. If not found anywhere
        console.warn(`Product with ID ${productId} not found in drafts or any live collection.`);
        setProductData(null);
        setIsLoadingProduct(false);
    };

    if (!isLoadingCategories) {
        findProduct();
    }
  }, [firestore, productId, categories, isLoadingCategories]);

  const transformedProductData: Product | null = useMemo(() => {
    if (productData) {
      // The category field in productData can be either a slug or a full name.
      // We pass it directly to the form, which will then use createSafeSlug on it.
      // This ensures consistency. The form's internal state will always be a slug.
      return {
        id: productData.id,
        name: productData.productTitle,
        category: productData.category, // Pass the raw category (slug or name)
        price: productData.price,
        stock: 100, // Placeholder
        stockStatus: productData.stockStatus || 'In Stock',
        sku: `SKU-${productData.id.substring(0, 6)}`, // Placeholder
        status: productData.status || 'Draft',
        attributes: productData.attributes,
        imageUrl: productData.productImages?.[0] || '',
        imageHint: 'product image',
        createdAt: (() => {
            if (!productData.createdAt) return new Date().toISOString();
            if (typeof productData.createdAt === 'string') return productData.createdAt;
            if (typeof (productData.createdAt as any)?.toDate === 'function') {
                return (productData.createdAt as any).toDate().toISOString();
            }
            return new Date(productData.createdAt).toISOString();
        })(),
        productCode: productData.productCode,
        productTitle: productData.productTitle,
        productDescription: productData.productDescription,
        productImages: productData.productImages,
        additionalImages: productData.additionalImages,
        specifications: productData.specifications,
        db: productData.db || dbFromUrl,
      };
    }
    return null;
  }, [productData, dbFromUrl]);

  const memoizedAttributes = useMemo(() => attributes || [], [attributes]);
  const memoizedCategories = useMemo(() => categories || [], [categories]);


  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Edit Product"
        description="Update the details of the product."
      />
      {isLoading ? (
        <EditProductFormSkeleton />
      ) : (
        <ProductForm 
          initialData={transformedProductData} 
          allAttributes={memoizedAttributes} 
          categories={memoizedCategories}
          initialDb={dbFromUrl}
          initialCategory={categorySlugFromUrl || ''}
        />
      )}
    </div>
  );
}
