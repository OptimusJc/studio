'use client';
import { PageHeader } from '../../../components/PageHeader';
import { ProductForm } from '../../components/ProductForm';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import type { Product, Attribute, Category } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

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
  const router = useRouter();
  
  const productId = params.id as string;
  const db = searchParams.get('db') as 'retailers' | 'buyers' || 'retailers';
  const categorySlug = searchParams.get('category');

  const productDocRef = useMemoFirebase(() => {
    if (!firestore || !db || !categorySlug || !productId) return null;
    return doc(firestore, `${db}/${categorySlug}/products`, productId);
  }, [firestore, db, categorySlug, productId]);
  
  const { data: productData, isLoading: isLoadingProduct } = useDoc<any>(productDocRef);

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
  
  const categoryNameFromSlug = categories?.find(c => c.name.toLowerCase().replace(/\s+/g, '-') === categorySlug)?.name;


  useEffect(() => {
      // If we are editing, but somehow the category name doesn't match a real category slug,
      // or the product doesn't exist after loading, redirect to the main products page.
      if (!isLoading && (!categorySlug || !productData)) {
          router.replace(`/admin/products?db=${db}`);
      }
  }, [isLoading, productData, categorySlug, router, db]);
  
  const transformedProductData: Product | null = (productData && categoryNameFromSlug) ? {
    id: productData.id,
    name: productData.productTitle,
    category: categoryNameFromSlug,
    price: productData.price,
    stock: 100, // Placeholder
    sku: `SKU-${productData.id.substring(0, 6)}`, // Placeholder
    status: productData.status || 'Draft',
    attributes: productData.attributes,
    imageUrl: productData.productImages?.[0] || '',
    imageHint: 'product image',
    createdAt: (() => {
        if (!productData.createdAt) return new Date().toISOString();
        if (typeof productData.createdAt.toDate === 'function') {
            return productData.createdAt.toDate().toISOString();
        }
        return new Date(productData.createdAt).toISOString();
    })(),
    productCode: productData.productCode,
    productTitle: productData.productTitle,
    productDescription: productData.productDescription,
    productImages: productData.productImages,
    additionalImages: productData.additionalImages,
    specifications: productData.specifications,
    db,
  } : null;

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Edit Product"
        description="Update the details of the product."
      />
      {isLoading || !transformedProductData ? (
        <EditProductFormSkeleton />
      ) : (
        <ProductForm 
          initialData={transformedProductData} 
          allAttributes={attributes || []} 
          categories={categories || []}
          initialDb={db}
          initialCategory={categorySlug || ''}
        />
      )}
    </div>
  );
}
