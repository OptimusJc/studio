
'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs, DocumentData } from 'firebase/firestore';
import type { Product, Category } from '@/types';

const databases = ['retailers', 'buyers'];

interface UseProductsProps {
  db: string | null;      // Specific DB or null for all
  category: string | null; // Specific category slug or null for all
}

export function useProducts({ db, category }: UseProductsProps) {
  const firestore = useFirestore();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const categoriesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: categoriesData, isLoading: isLoadingCategories } = useCollection<Category>(categoriesCollection);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!firestore || !categoriesData) return;

      setIsLoading(true);
      setError(null);

      try {
        const productMap = new Map<string, Product>();

        const dbsToFetch = db ? [db] : databases;
        
        // 1. Fetch Drafts
        const draftsQuery = query(collection(firestore, 'drafts'));
        const draftsSnapshot = await getDocs(draftsQuery);
        draftsSnapshot.forEach(doc => {
          const data = doc.data() as DocumentData;
          const productDb = data.db;
          // category is a slug in the DB
          const productCategorySlug = data.category;
          
          const dbMatch = !db || productDb === db;
          const categoryMatch = !category || productCategorySlug === category;

          if (dbMatch && categoryMatch) {
            const categoryName = categoriesData.find(c => c.name.toLowerCase().replace(/\s+/g, '-') === productCategorySlug)?.name || productCategorySlug;
            const product = {
              id: doc.id,
              ...data,
              name: data.productTitle,
              price: data.price,
              imageUrl: data.productImages?.[0] || 'https://placehold.co/600x600',
              category: categoryName,
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
          }
        });

        // 2. Fetch Published
        const productCategories = categoriesData.map(c => ({
            name: c.name,
            slug: c.name.toLowerCase().replace(/\s+/g, '-')
        }));

        const collectionsToFetch = category 
            ? productCategories.filter(c => c.slug === category)
            : productCategories;

        for (const dbToFetch of dbsToFetch) {
            for (const cat of collectionsToFetch) {
              const collectionPath = `${dbToFetch}/${cat.slug}/products`;
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
                    category: cat.name, // Use the proper name, not slug
                    db: dbToFetch,
                     createdAt: (() => {
                        if (!data.createdAt) return new Date().toISOString();
                        if (typeof data.createdAt === 'string') return data.createdAt;
                        if (typeof (data.createdAt as any)?.toDate === 'function') {
                            return (data.createdAt as any).toDate().toISOString();
                        }
                        return new Date(data.createdAt).toISOString();
                    })(),
                  } as Product;
                  // If a published product exists, it should overwrite the draft in the map
                  productMap.set(product.id, product);
                });
              } catch (e) {
                // It's ok if a collection doesn't exist.
              }
            }
        }
        
        const allProducts = Array.from(productMap.values());
        allProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setProducts(allProducts);

      } catch (e) {
        console.error("Failed to fetch products:", e);
        setError(e as Error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // This is the key change: We must handle the case where categories have loaded but are empty.
    if (!isLoadingCategories) {
      if (categoriesData && categoriesData.length > 0) {
        fetchProducts();
      } else {
         // Handle case with no categories (e.g., empty DB)
        setIsLoading(false);
        setProducts([]);
      }
    }
  }, [firestore, categoriesData, isLoadingCategories, db, category]);

  return { products, isLoading, error };
}
