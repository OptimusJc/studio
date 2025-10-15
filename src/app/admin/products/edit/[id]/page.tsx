'use client';
import { PageHeader } from '../../../components/PageHeader';
import { ProductForm } from '../../components/ProductForm';
import { attributes, categories } from '@/lib/placeholder-data';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useParams, useSearchParams } from 'next/navigation';
import type { Product } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

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
  const categoryName = searchParams.get('category');
  
  const categoryCollectionName = categoryName ? categoryName.toLowerCase().replace(/\s+/g, '-') : null;

  const productDocRef = useMemoFirebase(() => {
    if (!firestore || !categoryCollectionName || !productId) return null;
    return doc(firestore, categoryCollectionName, productId);
  }, [firestore, categoryCollectionName, productId]);
  
  const { data: productData, isLoading } = useDoc<any>(productDocRef);

  const attributeData = attributes.reduce((acc, attr) => {
    acc[attr.name.toLowerCase()] = attr.values;
    return acc;
  }, {} as Record<string, string[]>);
  
  const transformedProductData: Product | null = productData ? {
    id: productData.id,
    name: productData.productTitle,
    category: categoryName || '',
    price: productData.price,
    stock: 100, // Placeholder
    sku: `SKU-${productData.id.substring(0, 6)}`, // Placeholder
    status: 'Published', // Placeholder
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
    productTitle: productData.productTitle,
    productDescription: productData.productDescription,
    productImages: productData.productImages,
    additionalImages: productData.additionalImages,
    specifications: productData.specifications,
  } : null;

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
          attributes={attributeData} 
          categories={categories} 
        />
      )}
    </div>
  );
}
