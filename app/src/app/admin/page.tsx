
'use client';

import { PageHeader } from './components/PageHeader';
import { StatCard } from './components/StatCard';
import { ShoppingBasket, Users, LayoutGrid, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';
import { useProducts } from '@/hooks/use-products';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Category } from '@/types';
import { useMemo } from 'react';

export default function AdminDashboardPage() {
  const searchParams = useSearchParams();
  const db = searchParams.get('db') || 'retailers';

  // Fetch all products across all DBs and categories for stats and recent products
  const { 
    products: allProducts, 
    isLoading: isLoadingProducts 
  } = useProducts({ db: null, category: null });

  const firestore = useFirestore();
  const categoriesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: categoriesData, isLoading: isLoadingCategories } = useCollection<Category>(categoriesCollection);

  const isLoading = isLoadingProducts || isLoadingCategories;

  const stats = useMemo(() => ({
    totalProducts: allProducts?.length || 0,
    totalCategories: categoriesData?.length || 0,
    totalUsers: 0, // Placeholder
  }), [allProducts, categoriesData]);

  const recentProducts = useMemo(() => {
    if (!allProducts) return [];
    // The useProducts hook already sorts by createdAt descending
    return allProducts.slice(0, 5);
  }, [allProducts]);
  
  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Dashboard"
        description="Here's a quick overview of your catalog."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
            <>
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
            </>
        ) : (
            <>
                <StatCard 
                title="Total Products"
                value={stats.totalProducts.toString()}
                icon={ShoppingBasket}
                description="Across all databases and categories."
                />
                <StatCard 
                title="Total Categories"
                value={stats.totalCategories.toString()}
                icon={LayoutGrid}
                description="The total number of categories."
                />
                <StatCard 
                title="Total Users"
                value={stats.totalUsers.toString()}
                icon={Users}
                description="The total number of users."
                />
                <StatCard 
                title="Shared Links"
                value="12"
                icon={LinkIcon}
                description="Links generated this month."
                />
            </>
        )}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader className='flex-row items-center justify-between'>
            <div>
              <CardTitle>Recent Products</CardTitle>
              <CardDescription>The 5 most recently added products across all catalogs.</CardDescription>
            </div>
            <Button asChild size="sm">
              <Link href={`/admin/products?db=${db}`}>
                View All <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Database</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    [...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell colSpan={4}><Skeleton className="h-5 w-full" /></TableCell>
                        </TableRow>
                    ))
                ) : recentProducts.length > 0 ? (
                    recentProducts.map(product => (
                    <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                            <Badge variant="outline">{product.db}</Badge>
                        </TableCell>
                        <TableCell>
                           <Badge variant="secondary">{product.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right">${(product.price ?? 0).toFixed(2)}</TableCell>
                    </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No recent products found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
