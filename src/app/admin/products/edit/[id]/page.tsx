
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
                const categorySlug = cat.name.toLowerCase().replace(/\s+/g, '-');
                const liveCollectionPath = `${db}/${categorySlug}/products`;
                const productRef = doc(firestore, liveCollectionPath, productId);
                const productSnap = await getDoc(productRef);
                if (productSnap.exists()) {
                    // FIX: Manually add category and db to the data object
                    setProductData({ 
                        ...productSnap.data(), 
                        id: productSnap.id, 
                        category: categorySlug, // Add category slug from path
                        db: db                  // Add db from path
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

  const categoryNameFromProduct = useMemo(() => {
      if (!categories || !productData?.category) return null;
      // productData.category is a slug, so find matching category name
      return categories.find(c => c.name.toLowerCase().replace(/\s+/g, '-') === productData.category)?.name;
  }, [categories, productData]);


  const transformedProductData: Product | null = useMemo(() => {
    // This check is now robust for both draft and published products
    if (productData && categoryNameFromProduct) {
      return {
        id: productData.id,
        name: productData.productTitle,
        category: categoryNameFromProduct,
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
  }, [productData, categoryNameFromProduct, dbFromUrl]);

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
