'use client';

import { PageHeader } from '../../components/PageHeader';
import { ProductForm } from '../components/ProductForm';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useSearchParams } from 'next/navigation';
import { collection } from 'firebase/firestore';
import type { Attribute, Category } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

function NewProductFormSkeleton() {
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

export default function NewProductPage() {
  const searchParams = useSearchParams();
  const db = searchParams.get('db') || 'retailers';
  const category = searchParams.get('category');
  const firestore = useFirestore();

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

  const isLoading = isLoadingAttributes || isLoadingCategories;

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Add New Product"
        description="Fill in the details below to add a new product to your catalog."
      />
      {isLoading ? (
        <NewProductFormSkeleton />
      ) : (
        <ProductForm 
          allAttributes={attributes || []} 
          categories={categories || []}
          initialDb={db as 'retailers' | 'buyers'}
          initialCategory={category || ''}
        />
      )}
    </div>
  );
}
