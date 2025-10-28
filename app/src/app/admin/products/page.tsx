
'use client';
import { PageHeader } from '../components/PageHeader';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProductTableClient } from './components/ProductTableClient';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs, DocumentData } from 'firebase/firestore';
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
  const { data: categoriesData, isLoading: isLoadingCategories } = useCollection<Category>(categoriesCollection);

  const pageTitle = category 
    ? `${category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ')}`
    : 'All Products';
  
  const pageDescription = `Manage products in the ${db} database${category ? ` under the ${category} category` : ''}.`;

  useEffect(() => {
    const fetchProducts = async () => {
      if (!firestore || !categoriesData) return;

      setIsLoading(true);
      const productMap = new Map<string, Product>();
      
      const newDb = searchParams.get('db') || 'retailers';
      const newCategory = searchParams.get('category');
      
      // 1. Fetch Drafts
      const draftsQuery = query(collection(firestore, 'drafts'));
      const draftsSnapshot = await getDocs(draftsQuery);
      draftsSnapshot.forEach(doc => {
          const data = doc.data() as DocumentData;
           if (newDb === data.db && (!newCategory || newCategory === data.category)) {
              const product = {
                id: doc.id,
                ...data,
                name: data.productTitle,
                imageUrl: data.productImages?.[0] || 'https://placehold.co/600x600',
              } as Product;
              productMap.set(product.id, product);
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
                 const product = {
                  id: doc.id,
                  ...data,
                  name: data.productTitle,
                  imageUrl: data.productImages?.[0] || 'https://placehold.co/600x600',
                  category: cat,
                  db: newDb,
                } as Product;
                // If a published product exists, it should overwrite the draft in the map
                productMap.set(product.id, product);
            });
          } catch(e) {
            // It's ok if a collection doesn't exist.
          }
      }

      setProducts(Array.from(productMap.values()));
      setIsLoading(false);
    };
    
    if (!isLoadingCategories) {
        if (categoriesData) {
            fetchProducts();
        } else {
            // Handle case where there are no categories
            setIsLoading(false);
            setProducts([]);
        }
    }
  }, [firestore, searchParams, categoriesData, isLoadingCategories]);

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
