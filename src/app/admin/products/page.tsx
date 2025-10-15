'use client';
import { PageHeader } from '../components/PageHeader';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProductTableClient } from './components/ProductTableClient';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { collection, query, getDocs, DocumentData } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Product } from '@/types';
import { useSearchParams } from 'next/navigation';

const productCategories = [
  'wallpapers',
  'window-blinds',
  'wall-murals',
  'carpets',
  'window-films',
  'fluted-panels',
];

export default function ProductsPage() {
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const db = searchParams.get('db') || 'retailers';
  const category = searchParams.get('category');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState({ db, category });

  const pageTitle = category 
    ? `${category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ')}`
    : 'All Products';
  
  const pageDescription = `Manage products in the ${db} database${category ? ` under the ${category} category` : ''}.`;

  useEffect(() => {
    const fetchProducts = async () => {
      if (!firestore) return;

      const newDb = searchParams.get('db') || 'retailers';
      const newCategory = searchParams.get('category');

      if (currentView.db === newDb && currentView.category === newCategory && !isLoading) {
        return;
      }
      
      setIsLoading(true);
      setCurrentView({ db: newDb, category: newCategory });
      const fetchedProducts: Product[] = [];
      
      const categoriesToFetch = newCategory ? [newCategory] : productCategories;

      for (const cat of categoriesToFetch) {
        const collectionPath = `${newDb}/${cat}/products`;
        try {
          const q = query(collection(firestore, collectionPath));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            const data = doc.data() as DocumentData;
            const getCreatedAt = () => {
              if (!data.createdAt) return new Date().toISOString();
              if (typeof data.createdAt.toDate === 'function') {
                return data.createdAt.toDate().toISOString();
              }
              return new Date(data.createdAt).toISOString();
            }

            fetchedProducts.push({
              id: doc.id,
              name: data.productTitle,
              category: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' '),
              price: data.price,
              stock: 100, // Placeholder
              sku: `SKU-${doc.id.substring(0, 6)}`, // Placeholder
              status: 'Published', // Placeholder
              attributes: data.attributes,
              imageUrl: data.productImages?.[0] || 'https://placehold.co/600x600',
              imageHint: 'product image',
              createdAt: getCreatedAt(),
              productTitle: data.productTitle,
              productDescription: data.productDescription,
              productImages: data.productImages,
              additionalImages: data.additionalImages,
              specifications: data.specifications,
              db: newDb,
            } as Product);
          });
        } catch (error) {
          console.error(`Error fetching products from ${collectionPath}:`, error);
        }
      }
      setProducts(fetchedProducts);
      setIsLoading(false);
    };

    fetchProducts();
  }, [firestore, searchParams, currentView, isLoading]);

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
          <Button variant="outline"><Upload /> Bulk Import</Button>
          <Button asChild>
            <Link href={newProductUrl}>
              <PlusCircle /> Add Product
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
            <div className="text-center">Loading products...</div>
          ) : (
            <ProductTableClient products={products} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
