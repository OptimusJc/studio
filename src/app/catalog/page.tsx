'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { products, categories, attributes } from '@/lib/placeholder-data';
import type { Product } from '@/types';
import Header from './components/Header';
import FacetedSearch from './components/FacetedSearch';
import ProductCard from './components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';

function CatalogContent() {
  const searchParams = useSearchParams();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [filters, setFilters] = useState<Record<string, (string | number)[]>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Decode filters from URL on initial load
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

  useEffect(() => {
    let newFilteredProducts = [...products];

    // Apply search term filter
    if (searchTerm) {
      newFilteredProducts = newFilteredProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply faceted filters
    Object.entries(filters).forEach(([key, values]) => {
      if (values.length > 0) {
        if (key === 'price') {
            const [min, max] = values;
            newFilteredProducts = newFilteredProducts.filter(p => p.price >= min && p.price <= max);
        } else if (key === 'category') {
            newFilteredProducts = newFilteredProducts.filter(p => values.includes(p.category));
        } else {
          newFilteredProducts = newFilteredProducts.filter(p => {
             const productAttribute = p.attributes[key]
             if(Array.isArray(productAttribute)) {
                return productAttribute.some(attr => values.includes(attr as string));
             }
             return values.includes(productAttribute as string);
          });
        }
      }
    });

    setFilteredProducts(newFilteredProducts);

  }, [filters, searchTerm]);

  return (
    <div className="bg-background min-h-screen">
      <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <FacetedSearch
              categories={categories}
              attributes={attributes}
              appliedFilters={filters}
              onFilterChange={setFilters}
            />
          </aside>
          <section className="lg:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {filteredProducts.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center h-96 bg-card rounded-lg border border-dashed">
                    <h2 className="text-2xl font-semibold text-muted-foreground">No Products Found</h2>
                    <p className="text-muted-foreground mt-2">Try adjusting your filters or search term.</p>
                </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function CatalogPageSkeleton() {
    return (
        <div className="bg-background min-h-screen">
            <Header searchTerm="" setSearchTerm={() => {}} />
            <main className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-4 gap-8">
                    <aside className="lg:col-span-1">
                        <Skeleton className="h-96 w-full" />
                    </aside>
                    <section className="lg:col-span-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="h-96 w-full" />
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    )
}

export default function CatalogPage() {
    return (
        <Suspense fallback={<CatalogPageSkeleton />}>
            <CatalogContent />
        </Suspense>
    )
}
