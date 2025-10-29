
'use client';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs, DocumentData } from 'firebase/firestore';
import { useEffect, useState } from 'react';
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
import type { Product, Category } from '@/types';
import { useSearchParams } from 'next/navigation';


const databases = ['retailers', 'buyers'];

export default function AdminDashboardPage() {
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const db = searchParams.get('db') || 'retailers';


  const categoriesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: categoriesData, isLoading: isLoadingCategories } = useCollection<Category>(categoriesCollection);

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalUsers: 0, // Placeholder, user management not implemented
  });
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (categoriesData) {
      setStats(prev => ({ ...prev, totalCategories: categoriesData.length }));
    }
  }, [categoriesData]);

  useEffect(() => {
    const fetchData = async () => {
      if (!firestore || !categoriesData) return;
      setIsLoading(true);

      try {
        const productMap = new Map<string, Product>();
        
        const productCategories = categoriesData.map(c => c.name.toLowerCase().replace(/\s+/g, '-'));

        // 1. Fetch Drafts for all DBs
        const draftsQuery = query(collection(firestore, 'drafts'));
        const draftsSnapshot = await getDocs(draftsQuery);
        draftsSnapshot.forEach(doc => {
            const data = doc.data() as DocumentData;
            const product = {
              id: doc.id,
              ...data,
              name: data.productTitle,
              price: data.price,
              imageUrl: data.productImages?.[0] || 'https://placehold.co/600x600',
               createdAt: (() => {
                  if (!data.createdAt) return new Date().toISOString();
                  if (typeof data.createdAt === 'string') return data.createdAt;
                  if (typeof (data.createdAt as any)?.toDate === 'function') {
                      return (data.createdAt as any).toDate().toISOString();
                  }
                  return new Date(data.createdAt).toISOString();
              })(),
            } as Product;
            productMap.set(product.id, product);
        });

        // 2. Fetch Published for all DBs
        for (const db of databases) {
          for (const cat of productCategories) {
              const collectionPath = `${db}/${cat}/products`;
              try {
                const publishedQuery = query(collection(firestore, collectionPath));
                const publishedSnapshot = await getDocs(publishedQuery);
                publishedSnapshot.forEach(doc => {
                    const data = doc.data() as DocumentData;
                    const product = {
                      id: doc.id,
                      ...data,
                      name: data.productTitle,
                      price: data.price,
                      imageUrl: data.productImages?.[0] || 'https://placehold.co/600x600',
                      category: cat,
                      db: db,
                      createdAt: (() => {
                          if (!data.createdAt) return new Date().toISOString();
                          if (typeof data.createdAt === 'string') return data.createdAt;
                          if (typeof (data.createdAt as any)?.toDate === 'function') {
                              return (data.createdAt as any).toDate().toISOString();
                          }
                          return new Date(data.createdAt).toISOString();
                      })(),
                    } as Product;
                    productMap.set(product.id, product);
                });
              } catch(e) {
                // It's ok if a collection doesn't exist.
              }
          }
        }

        const allProducts = Array.from(productMap.values());
        allProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setRecentProducts(allProducts.slice(0, 5));
        setStats(prev => ({ ...prev, totalProducts: allProducts.length }));
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // This is the key change: We must handle the case where categories have loaded but are empty.
    if (!isLoadingCategories) {
        if (categoriesData && categoriesData.length > 0) {
            fetchData();
        } else {
             // Handle case with no categories (e.g., empty DB)
            setIsLoading(false);
            setRecentProducts([]);
            setStats(prev => ({ ...prev, totalProducts: 0, totalCategories: categoriesData?.length || 0 }));
        }
    }
  }, [firestore, categoriesData, isLoadingCategories]);


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
