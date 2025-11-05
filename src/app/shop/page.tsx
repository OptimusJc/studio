
'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs, DocumentData, where } from 'firebase/firestore';
import type { Product, Category, Attribute } from '@/types';
import Header from './components/Header';
import FacetedSearch from './components/FacetedSearch';
import ProductCard from './components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Filter } from 'lucide-react';
import Link from 'next/link';

function CatalogContent() {
  const firestore = useFirestore();
  const searchParams = useSearchParams();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<Record<string, any[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const categoriesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: categoriesData, isLoading: isLoadingCategories } = useCollection<Category>(categoriesCollection);

  const attributesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'attributes');
  }, [firestore]);
  const { data: attributesData, isLoading: isLoadingAttributes } = useCollection<Attribute>(attributesCollection);

  // Fetch all products from all categories
  useEffect(() => {
    const fetchAllProducts = async () => {
      if (!firestore || !categoriesData) return;
      setIsLoading(true);

      const productMap = new Map<string, Product>();
      
      const productCategories = categoriesData.map(c => ({
          slug: c.name.toLowerCase().replace(/\s+/g, '-'),
          name: c.name
      }));

      // We only care about published products in the buyer's database for the catalog
      const db = 'buyers';

      for (const cat of productCategories) {
        const collectionPath = `${db}/${cat.slug}/products`;
        try {
          // Correctly query for only published products
          const publishedQuery = query(collection(firestore, collectionPath), where("status", "==", "Published"));
          const publishedSnapshot = await getDocs(publishedQuery);
          
          publishedSnapshot.forEach(doc => {
            const data = doc.data() as DocumentData;
            const product = {
              id: doc.id,
              ...data,
              name: data.productTitle,
              imageUrl: data.productImages?.[0] || 'https://placehold.co/600x600',
              category: cat.name, // Use the proper name, not slug
              db: db,
            } as Product;
            productMap.set(product.id, product);
          });
        } catch (e) {
          // It's ok if a collection doesn't exist.
        }
      }
      
      const products = Array.from(productMap.values());
      setAllProducts(products);
      setIsLoading(false);
    };

    if (!isLoadingCategories) {
      if (categoriesData && categoriesData.length > 0) {
        fetchAllProducts();
      } else {
        setAllProducts([]);
        setIsLoading(false);
      }
    }
  }, [firestore, categoriesData, isLoadingCategories]);

  // Decode filters from URL on initial load
  useEffect(() => {
    const urlFilters = searchParams.get('filters');
    if (urlFilters) {
      try {
        const decodedFilters = JSON.parse(atob(urlFilters));
        setFilters(decodedFilters);
      } catch (e) {
        console.error('Failed to parse filters from URL', e);
      }
    }
  }, [searchParams]);

  // Apply filters and search term
  useEffect(() => {
    let newFilteredProducts = [...allProducts];

    // Apply search term filter
    if (searchTerm) {
      newFilteredProducts = newFilteredProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.attributes.brand as string)?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply faceted filters
    Object.entries(filters).forEach(([key, values]) => {
      if (values.length > 0) {
        if (key === 'price') {
            const [min, max] = values;
            newFilteredProducts = newFilteredProducts.filter(p => (p.price ?? 0) >= min && (p.price ?? 0) <= max);
        } else if (key === 'category') {
            newFilteredProducts = newFilteredProducts.filter(p => values.includes(p.category));
        } else {
          newFilteredProducts = newFilteredProducts.filter(p => {
             const productAttribute = p.attributes[key];
             if(Array.isArray(productAttribute)) {
                return productAttribute.some(attr => values.includes(attr as string));
             }
             return values.includes(productAttribute as string);
          });
        }
      }
    });

    setFilteredProducts(newFilteredProducts);

  }, [filters, searchTerm, allProducts]);

  const memoizedCategories = useMemo(() => categoriesData || [], [categoriesData]);
  const memoizedAttributes = useMemo(() => attributesData || [], [attributesData]);

  const facetedSearchComponent = (
    isLoadingCategories || isLoadingAttributes ? (
        <Skeleton className="h-[600px] w-full" />
    ) : (
        <FacetedSearch
        categories={memoizedCategories}
        attributes={memoizedAttributes}
        appliedFilters={filters}
        onFilterChange={setFilters}
        />
    )
  )

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header 
        categories={memoizedCategories} 
        appliedFilters={filters}
        onFilterChange={setFilters}
      />
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8 items-start">
          <aside className="lg:col-span-1 hidden lg:block sticky top-24">
            {facetedSearchComponent}
          </aside>
          <section className="lg:col-span-3">
             <div className="flex items-center justify-between mb-6 lg:hidden">
                <h1 className="text-2xl font-bold">Products</h1>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline">
                            <Filter className="mr-2 h-4 w-4" />
                            Filters
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full max-w-sm">
                        <div className="p-4">
                            {facetedSearchComponent}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(12)].map((_, i) => (
                        <Skeleton key={i} className="h-80 w-full" />
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map((product) => (
                           <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                    {filteredProducts.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center h-96 bg-background rounded-lg border border-dashed">
                            <h2 className="text-2xl font-semibold text-muted-foreground">No Products Found</h2>
                            <p className="text-muted-foreground mt-2">Try adjusting your filters or search term.</p>
                        </div>
                    )}
                </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function ShopPageSkeleton() {
    return (
        <div className="bg-gray-50 min-h-screen">
             <header className="sticky top-0 z-40 w-full border-b bg-background">
                <div className="container mx-auto flex h-20 items-center justify-between px-4">
                    <Skeleton className="h-8 w-48" />
                    <div className="hidden lg:flex gap-2">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-24" />
                    </div>
                    <Skeleton className="h-8 w-8 lg:hidden" />
                </div>
             </header>
            <main className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-4 gap-8">
                    <aside className="lg:col-span-1 hidden lg:block">
                        <Skeleton className="h-[600px] w-full" />
                    </aside>
                    <section className="lg:col-span-3">
                         <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                            {[...Array(12)].map((_, i) => (
                                <Skeleton key={i} className="h-80 w-full" />
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    )
}

export default function ShopPage() {
    return (
        <Suspense fallback={<ShopPageSkeleton />}>
            <CatalogContent />
        </Suspense>
    )
}
