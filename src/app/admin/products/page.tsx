
'use client';
import { PageHeader } from '../components/PageHeader';
import { Button } from '@/components/ui/button';
import { Upload, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProductTableClient } from './components/ProductTableClient';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs, DocumentData } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import type { Product, Category } from '@/types';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


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
  
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

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

      setAllProducts(Array.from(productMap.values()));
      setIsLoading(false);
    };
    
    if (!isLoadingCategories) {
        if (categoriesData && categoriesData.length > 0) {
            fetchProducts();
        } else {
            // Handle case where there are no categories
            setIsLoading(false);
            setAllProducts([]);
        }
    }
  }, [firestore, searchParams, categoriesData, isLoadingCategories]);

  useEffect(() => {
    let products = [...allProducts];

    // Apply search term filter
    if (searchTerm) {
      products = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      products = products.filter(p => p.status === statusFilter);
    }

    setFilteredProducts(products);
  }, [searchTerm, statusFilter, allProducts]);


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
           <div className="flex items-center gap-4 mb-6 px-1">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="Published">Published</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
           </div>
          {isLoading ? (
            <ProductTableSkeleton />
          ) : filteredProducts.length === 0 && !isLoading ? (
             <div className="col-span-full flex flex-col items-center justify-center h-96 text-center">
                <h2 className="text-2xl font-semibold text-muted-foreground">No Products Found</h2>
                <p className="text-muted-foreground mt-2">Try adjusting your filters or add a new product.</p>
            </div>
          ) : (
            <ProductTableClient products={filteredProducts} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
