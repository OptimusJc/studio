
'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs, where, limit, DocumentData, doc, getDoc } from 'firebase/firestore';
import type { Product, Category, Attribute } from '@/types';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { WhatsAppIcon } from '@/components/icons/WhatsappIcon';
import Link from 'next/link';
import ProductDetailHeader from '../components/ProductDetailHeader';

function ProductDetailSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                <div className="grid grid-cols-1 md:grid-cols-[80px_1fr] gap-4">
                    <div className="flex md:flex-col gap-3 order-last md:order-first">
                        <Skeleton className="aspect-square w-full rounded-lg" />
                        <Skeleton className="aspect-square w-full rounded-lg" />
                        <Skeleton className="aspect-square w-full rounded-lg" />
                    </div>
                    <Skeleton className="aspect-square w-full rounded-xl" />
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-5/6" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <div className="flex gap-2">
                            <Skeleton className="h-10 w-24" />
                            <Skeleton className="h-10 w-24" />
                            <Skeleton className="h-10 w-24" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <div className="flex gap-2">
                            <Skeleton className="h-16 w-16" />
                            <Skeleton className="h-16 w-16" />
                            <Skeleton className="h-16 w-16" />
                        </div>
                    </div>
                    <Skeleton className="h-12 w-48" />
                </div>
            </div>
             <div className="mt-16">
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-80 w-full" />
                    ))}
                </div>
            </div>
        </div>
    );
}

function ProductDetailPageContent() {
  const params = useParams();
  const firestore = useFirestore();
  const router = useRouter();

  const productId = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>('');

  const categoriesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: categoriesData, isLoading: isLoadingCategories } = useCollection<Category>(categoriesCollection);

  useEffect(() => {
    const findProduct = async () => {
        if (!firestore || !productId || !categoriesData) return;
        setIsLoading(true);

        let foundProduct: Product | null = null;
        let productCategoryName: string | null = null;
        
        for (const cat of categoriesData) {
            const categorySlug = cat.name.toLowerCase().replace(/\s+/g, '-');
            const liveCollectionPath = `buyers/${categorySlug}/products`;
            try {
                const productRef = doc(firestore, liveCollectionPath, productId);
                const productSnap = await getDoc(productRef);
                
                if (productSnap.exists()) {
                    const data = productSnap.data() as DocumentData;
                     if (data.status === 'Published') {
                        foundProduct = {
                            id: productSnap.id,
                            ...data,
                            name: data.productTitle,
                            imageUrl: data.productImages?.[0] || 'https://placehold.co/600x600',
                            category: cat.name,
                            db: 'buyers',
                        } as Product;
                        productCategoryName = cat.name;
                        break; // Found the product, no need to search further
                    }
                }
            } catch(e) {
                // Collection might not exist, which is fine.
            }
        }

        if (foundProduct) {
            setProduct(foundProduct);
            setActiveImage(foundProduct.productImages?.[0] || '');
            
            // Fetch related products
            if (productCategoryName) {
                 const categorySlug = productCategoryName.toLowerCase().replace(/\s+/g, '-');
                 const relatedCollectionPath = `buyers/${categorySlug}/products`;
                 const q = query(
                     collection(firestore, relatedCollectionPath), 
                     where("status", "==", "Published"),
                     limit(7)
                 );
                 const querySnapshot = await getDocs(q);
                 const fetchedRelated: Product[] = [];
                 querySnapshot.forEach((doc) => {
                     if (doc.id !== productId) { // Exclude the current product
                        const data = doc.data() as DocumentData;
                        fetchedRelated.push({
                            id: doc.id,
                            ...data,
                            name: data.productTitle,
                            imageUrl: data.productImages?.[0] || 'https://placehold.co/600x600',
                            category: productCategoryName,
                            db: 'buyers',
                        } as Product)
                     }
                 });
                 setRelatedProducts(fetchedRelated.slice(0, 6));
            }

        } else {
            console.warn(`Published product with ID ${productId} not found in 'buyers' database.`);
        }
        setIsLoading(false);
    };

    if (!isLoadingCategories && categoriesData) {
        findProduct();
    }
  }, [firestore, productId, categoriesData, isLoadingCategories]);

  const allImages = useMemo(() => {
    if (!product) return [];
    return [...(product.productImages || []), ...(product.additionalImages || [])];
  }, [product]);
  
  if (isLoading || isLoadingCategories) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] bg-background">
            <h2 className="text-2xl font-semibold text-muted-foreground">Product Not Found</h2>
            <p className="text-muted-foreground mt-2">The product you are looking for does not exist or is not available.</p>
            <Button onClick={() => router.push('/shop')} className="mt-6">Back to Shop</Button>
        </div>
    );
  }

  const handleFilterChange = (filters: Record<string, any[]>) => {
    const encodedFilters = btoa(JSON.stringify(filters));
    router.push(`/shop?filters=${encodedFilters}`);
  }

  return (
    <>
      <ProductDetailHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
            <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] gap-4">
                <div className="flex md:flex-col gap-3 order-last md:order-first">
                    {allImages.map((img, index) => (
                        <div key={index} 
                             className={`aspect-square w-full rounded-lg overflow-hidden border-2 cursor-pointer ${activeImage === img ? 'border-primary' : 'border-transparent'}`}
                             onClick={() => setActiveImage(img)}
                        >
                            <Image src={img} alt={`${product.name} thumbnail ${index + 1}`} width={100} height={100} className="object-cover w-full h-full"/>
                        </div>
                    ))}
                </div>
                <div className="aspect-square w-full rounded-xl overflow-hidden bg-muted relative">
                    {activeImage && (
                        <Image src={activeImage} alt={product.name} fill className="object-cover"/>
                    )}
                </div>
            </div>

            <div className="py-4">
                <h1 className="text-4xl lg:text-5xl font-bold">{product.productCode}</h1>
                <p className="mt-2 text-lg text-muted-foreground">{product.productTitle}</p>
                
                <div className="mt-6">
                    <h2 className="text-md font-semibold">Description</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{product.specifications}</p>
                </div>

                 <div className="mt-6">
                    <h2 className="text-md font-semibold">Dimensions</h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                        <Button variant="outline" size="sm" className="rounded-full">53cmX20m</Button>
                        <Button variant="outline" size="sm" className="rounded-full">53cmX1m</Button>
                        <Button variant="outline" size="sm" className="rounded-full">53cmX5m</Button>
                    </div>
                </div>

                <div className="mt-6">
                    <h2 className="text-md font-semibold">Color: {product.attributes?.color as string || ''}</h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {allImages.slice(0,4).map((img, index) => (
                            <div key={index} className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${activeImage === img ? 'border-primary' : 'border-transparent'}`} onClick={() => setActiveImage(img)}>
                                <Image src={img} alt={`Color variant ${index + 1}`} width={80} height={80} className="object-cover w-full h-full"/>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8">
                    <Button size="lg" className="bg-green-500 hover:bg-green-600 rounded-full text-white">
                        <WhatsAppIcon className="mr-2 h-5 w-5"/>
                        WhatsApp Share
                    </Button>
                </div>

            </div>
        </div>

        {relatedProducts.length > 0 && (
             <div className="mt-16 lg:mt-24">
                <h2 className="text-2xl font-bold mb-6">Related Items</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                     {relatedProducts.map(related => (
                        <Link key={related.id} href={`/shop/${related.id}`} className="h-full">
                            <ProductCard product={related} />
                        </Link>
                     ))}
                </div>
            </div>
        )}
      </main>
    </>
  );
}

export default function ProductDetailPage() {
    return (
        <div className="bg-muted/40 min-h-screen">
             <Suspense fallback={<ProductDetailSkeleton />}>
                <ProductDetailPageContent />
            </Suspense>
        </div>
    )
}
