'use client';
import { products } from '@/lib/placeholder-data';
import { PageHeader } from '../components/PageHeader';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProductTableClient } from './components/ProductTableClient';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs, DocumentData } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Product } from '@/types';

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
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!firestore) return;

      setIsLoading(true);
      const products: Product[] = [];
      
      for (const category of productCategories) {
        try {
          const q = query(collection(firestore, category));
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            const data = doc.data() as DocumentData;
            products.push({
              id: doc.id,
              name: data.productTitle,
              category: category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' '),
              price: data.price,
              // These are placeholders, update as needed
              stock: 100, 
              sku: `SKU-${doc.id.substring(0, 6)}`,
              status: 'Published',
              attributes: data.attributes,
              imageUrl: data.productImages[0] || 'https://placehold.co/600x600',
              imageHint: 'product image',
              createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
              productImages: data.productImages,
              productDescription: data.productDescription,
              specifications: data.specifications,
              additionalImages: data.additionalImages,
            } as Product);
          });
        } catch (error) {
          console.error(`Error fetching products from ${category}:`, error);
        }
      }
      setAllProducts(products);
      setIsLoading(false);
    };

    fetchProducts();
  }, [firestore]);


  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Products"
        description="Manage all products in your catalog."
      >
        <div className="flex items-center gap-2">
          <Button variant="outline"><Upload /> Bulk Import</Button>
          <Button asChild>
            <Link href="/admin/products/new">
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
            <ProductTableClient products={allProducts} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
