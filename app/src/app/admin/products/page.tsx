
'use client';
import { PageHeader } from '../components/PageHeader';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProductTableClient } from './components/ProductTableClient';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useProducts } from '@/hooks/use-products';


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
  const searchParams = useSearchParams();
  const db = searchParams.get('db') || 'retailers';
  const category = searchParams.get('category');
  
  const { products, isLoading } = useProducts({ db, category });

  const pageTitle = category 
    ? `${category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ')}`
    : 'All Products';
  
  const pageDescription = `Manage products in the ${db} database${category ? ` under the ${category} category` : ''}.`;

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
            <ProductTableClient products={products || []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
