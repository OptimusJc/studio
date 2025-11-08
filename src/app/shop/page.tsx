
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
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Filter, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';


function CatalogContent() {
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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

      const productList: Product[] = [];
      
      const productCategories = categoriesData.map(c => ({
          slug: c.name.toLowerCase().replace(/\s+/g, '-'),
          name: c.name
      }));

      for (const cat of productCategories) {
        const collectionPath = `buyers/${cat.slug}/products`;
        try {
          const q = query(
            collection(firestore, collectionPath), 
            where("status", "==", "Published")
          );
          const querySnapshot = await getDocs(q);
          
          querySnapshot.forEach(doc => {
            const data = doc.data() as DocumentData;
            const product: Product = {
              id: doc.id,
              name: data.productTitle,
              productTitle: data.productTitle,
              productCode: data.productCode,
              productDescription: data.productDescription,
              category: cat.name,
              price: data.price,
              status: 'Published',
              attributes: data.attributes,
              imageUrl: data.productImages?.[0] || 'https://placehold.co/600x600',
              productImages: data.productImages,
              additionalImages: data.additionalImages,
              specifications: data.specifications,
              db: 'buyers',
              stock: data.stock || 0,
              sku: data.sku || '',
              imageHint: data.imageHint || '',
              createdAt: data.createdAt || '',
            };
            productList.push(product);
          });
        } catch (e) {
          // console.warn(`Could not fetch from ${collectionPath}:`, e);
        }
      }
      
      setAllProducts(productList);
      setIsLoading(false);
    };

    if (!isLoadingCategories && categoriesData) {
        fetchAllProducts();
    } else if (!isLoadingCategories) {
        setIsLoading(false);
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

    if (searchTerm) {
        const lowercasedTerm = searchTerm.toLowerCase();
        newFilteredProducts = newFilteredProducts.filter(p =>
            (p.productTitle && p.productTitle.toLowerCase().includes(lowercasedTerm)) ||
            (p.productCode && p.productCode.toLowerCase().includes(lowercasedTerm)) ||
            (p.productDescription && p.productDescription.toLowerCase().includes(lowercasedTerm)) ||
            (p.specifications && p.specifications.toLowerCase().includes(lowercasedTerm))
      );
    }
    
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
  
  const consolidatedAttributes = useMemo(() => {
    if (!attributesData) return [];

    const allowedFilters = ['Color', 'Material', 'Texture', 'Pattern'];
    const attributeMap = new Map<string, { id: string; values: Set<string> }>();

    attributesData.forEach(attr => {
        if (allowedFilters.includes(attr.name)) {
            const filterName = attr.name === 'Pattern' ? 'Style' : attr.name;
            if (!attributeMap.has(filterName)) {
                attributeMap.set(filterName, { id: attr.id, values: new Set() });
            }
            const attrGroup = attributeMap.get(filterName)!;
            attr.values.forEach(val => attrGroup.values.add(val));
        }
    });

    return Array.from(attributeMap.entries()).map(([name, group]) => ({
        id: group.id,
        name: name,
        category: 'All', 
        values: Array.from(group.values).sort(),
    }));
  }, [attributesData]);


  const facetedSearchComponent = (
    isLoadingAttributes ? (
        <Skeleton className="h-[600px] w-full" />
    ) : (
        <FacetedSearch
        attributes={consolidatedAttributes}
        appliedFilters={filters}
        onFilterChange={setFilters}
        isMobile={isMobile}
        onClose={() => setMobileFiltersOpen(false)}
        />
    )
  );

  return (
    <div className="bg-muted/40 min-h-screen">
      <Header 
        categories={memoizedCategories} 
        appliedFilters={filters}
        onFilterChange={setFilters}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        openMobileFilters={() => setMobileFiltersOpen(true)}
      />
       <main className="container mx-auto px-4 py-6">
            <div className="grid lg:grid-cols-4 gap-8 items-start">
                <aside className="hidden lg:block lg:col-span-1 sticky top-24">
                  {facetedSearchComponent}
                </aside>
                
                <section className="lg:col-span-3">
                    <div className="hidden lg:flex items-center gap-4 mb-6">
                        <div className="relative w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                              type="search"
                              placeholder="Search by product name, code, or characteristics..."
                              className="pl-12 pr-10 py-3 h-12 text-base rounded-md shadow-sm"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                                onClick={() => setSearchTerm('')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                        </div>
                    </div>
                     <Dialog open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                         <DialogContent className="p-0 h-[100dvh] w-full max-w-full sm:max-w-full overflow-y-auto block !rounded-none !border-0">
                            {facetedSearchComponent}
                         </DialogContent>
                    </Dialog>

                     {isLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {[...Array(12)].map((_, i) => (
                                <Skeleton key={i} className="h-96 w-full rounded-lg" />
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                {filteredProducts.map((product, index) => (
                                   <ProductCard key={product.id} product={product} priority={index < 4} />
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
        <div className="bg-muted/40 min-h-screen">
             <header className="sticky top-0 z-40 w-full border-b bg-background">
                <div className="container mx-auto flex h-20 items-center justify-between px-4">
                    <Skeleton className="h-8 w-48" />
                    <div className="hidden lg:flex justify-end flex-1 gap-2">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-24" />
                    </div>
                    <Skeleton className="h-8 w-8 lg:hidden" />
                </div>
             </header>
            <main className="container mx-auto px-4 py-8">
                 <div className="grid lg:grid-cols-4 gap-8 items-start">
                    <aside className="hidden lg:block lg:col-span-1">
                        <Skeleton className="h-[600px] w-full" />
                    </aside>
                    <div className="lg:col-span-3 space-y-6">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-12 w-28 lg:hidden" />
                            <Skeleton className="h-12 flex-1" />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                            {[...Array(12)].map((_, i) => (
                                <Skeleton key={i} className="h-80 w-full" />
                            ))}
                        </div>
                    </div>
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
