'use client';
import { PageHeader } from '../components/PageHeader';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProductTableClient } from './components/ProductTableClient';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs, DocumentData, collectionGroup } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Product, Category } from '@/types';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';


function ProductTableSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
}

export default function ProductsPage() {
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  
  const db = searchParams.get('db') || 'retailers';
  const category = searchParams.get('category');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const categoriesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: categoriesData } = useCollection<Category>(categoriesCollection);

  const pageTitle = category 
    ? `${category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ')}`
    : 'All Products';
  
  const pageDescription = `Manage products in the ${db} database${category ? ` under the ${category} category` : ''}.`;

  useEffect(() => {
    const fetchProducts = async () => {
      if (!firestore || !categoriesData) return;

      setIsLoading(true);
      const fetchedProducts: Product[] = [];
      
      const newDb = searchParams.get('db') || 'retailers';
      const newCategory = searchParams.get('category');
      
      // 1. Fetch Drafts
      const draftsQuery = query(collection(firestore, 'drafts'));
      const draftsSnapshot = await getDocs(draftsQuery);
      draftsSnapshot.forEach(doc => {
          const data = doc.data() as DocumentData;
           if (newDb === data.db && (!newCategory || newCategory === data.category)) {
              fetchedProducts.push({
                id: doc.id,
                ...data,
                name: data.productTitle,
                imageUrl: data.productImages?.[0] || 'https://placehold.co/600x600',
              } as Product);
           }
      });


      // 2. Fetch Published
      const productCategories = categoriesData.map(c => c.name.toLowerCase().replace(/\s+/g, '-'));
      const collectionsToFetch = newCategory ? [newCategory] : productCategories;

      for (const cat of collectionsToFetch) {
          const collectionPath = `${newDb}/${cat}/products`;
          try {
            const publishedQuery = query(collection(firestore, collectionPath));
            const publishedSnapshot = await getDocs(publishedQuery);
            publishedSnapshot.forEach(doc => {
                const data = doc.data() as DocumentData;
                 fetchedProducts.push({
                  id: doc.id,
                  ...data,
                  name: data.productTitle,
                  imageUrl: data.productImages?.[0] || 'https://placehold.co/600x600',
                } as Product);
            });
          } catch(e) {
            // It's ok if a collection doesn't exist.
          }
      }

      // Simple deduplication based on productCode if needed, favoring published
      const productMap = new Map<string, Product>();
      fetchedProducts.forEach(p => {
          const existing = productMap.get(p.productCode as string);
          if (!existing || (existing.status === 'Draft' && p.status === 'Published')) {
              productMap.set(p.productCode as string, p);
          }
      });

      setProducts(Array.from(productMap.values()));
      setIsLoading(false);
    };

    if (categoriesData) {
      fetchProducts();
    }
  }, [firestore, searchParams, categoriesData]);

  const newProductUrl = category 
    ? `/admin/products/new?db=${db}&category=${category}`
    : `/admin/products/new?db=${db}`;

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title={pageTitle}
        description={pageDescription}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Bulk Import</Button>
          <Button asChild>
            <Link href={newProductUrl}>
              Add Product
            </Link>
          </Button>
        </div>
      </PageHeader>
      
      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
          <CardDescription>A list of all products including their status and stock levels.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ProductTableSkeleton />
          ) : (
            <ProductTableClient products={products} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
