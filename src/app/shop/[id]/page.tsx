
'use client';

import * as React from 'react';
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
import { Separator } from '@/components/ui/separator';
import { ChevronLeft } from 'lucide-react';

function ProductDetailSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                <div className="space-y-4">
                    <Skeleton className="aspect-square w-full rounded-xl" />
                    <div className="grid grid-cols-5 gap-3">
                        <Skeleton className="aspect-square w-full rounded-lg" />
                        <Skeleton className="aspect-square w-full rounded-lg" />
                        <Skeleton className="aspect-square w-full rounded-lg" />
                    </div>
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-20 w-full" />
                    <div className="space-y-4">
                        <Skeleton className="h-5 w-24" />
                        <div className="flex gap-4">
                            <Skeleton className="h-10 w-24" />
                            <Skeleton className="h-10 w-24" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-5 w-24" />
                         <div className="flex gap-4">
                            <Skeleton className="h-10 w-24" />
                            <Skeleton className="h-10 w-24" />
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

  const specificationItems = useMemo(() => {
    if (!product || !product.specifications) return [];
    return product.specifications.split(';').map(item => {
        const parts = item.split(':');
        if (parts.length === 2) {
            return { key: parts[0].trim(), value: parts[1].trim() };
        }
        return null;
    }).filter(Boolean);
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

  const generateWhatsAppMessage = () => {
    let message = `*Product Inquiry*\n\n`;
    message += `Hello, I'm interested in this product. Could you please confirm its availability and price?\n\n`;
    message += `*Product Details:*\n`;
    message += `Code: *${product.productCode}*\n`;
    message += `Title: ${product.productTitle}\n`;
    
    if (product.productImages && product.productImages.length > 0) {
      message += `Image: ${product.productImages[0]}\n`;
    }

    if (product.attributes && Object.keys(product.attributes).length > 0) {
      message += `\n*Attributes:*\n`;
      Object.entries(product.attributes).forEach(([key, value]) => {
        const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
        const formattedValue = Array.isArray(value) ? value.join(', ') : value;
        message += `${formattedKey}: ${formattedValue}\n`;
      });
    }

    message += `\nLink: ${window.location.href}`;

    return encodeURIComponent(message);
  };
  
  const whatsAppUrl = `https://wa.me/?text=${generateWhatsAppMessage()}`;


  return (
    <>
      <ProductDetailHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
                <Link href="/shop" prefetch={false}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Catalog
                </Link>
            </Button>
        </div>
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
            <div className="flex flex-col md:flex-row-reverse gap-4">
                <div className="aspect-[5/4] w-full rounded-xl overflow-hidden bg-muted relative flex-grow">
                    {activeImage && (
                        <Image 
                            src={activeImage} 
                            alt={product.name} 
                            fill 
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover" 
                            priority 
                        />
                    )}
                </div>
                 <div className="flex flex-row md:flex-col gap-3 md:w-20 flex-shrink-0">
                    {allImages.map((img, index) => (
                        <div key={index} 
                             className={`aspect-square w-full rounded-lg overflow-hidden border-2 cursor-pointer ${activeImage === img ? 'border-primary' : 'border-transparent'}`}
                             onClick={() => setActiveImage(img)}
                        >
                            <Image src={img} alt={`${product.name} thumbnail ${index + 1}`} width={100} height={100} className="object-cover w-full h-full"/>
                        </div>
                    ))}
                </div>
            </div>

            <div className="py-4 space-y-4">
                <div>
                    <h1 className="text-4xl lg:text-5xl font-bold font-mono">{product.productCode}</h1>
                    <p className="mt-2 text-lg text-muted-foreground">{product.productTitle}</p>
                </div>
                
                {product.productDescription && (
                    <div>
                        <h2 className="text-md font-semibold">Description</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{product.productDescription}</p>
                    </div>
                )}
                
                {Object.keys(product.attributes).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h2 className="text-md font-semibold mb-3">Details</h2>
                        <div className="border rounded-lg overflow-hidden">
                            <div className="grid grid-cols-2 text-sm">
                                {Object.entries(product.attributes).map(([key, value], index) => (
                                    <div key={key} className={`grid grid-cols-2 items-center ${index >= 2 ? 'border-t' : ''}`}>
                                        <div className={`font-medium capitalize p-3 bg-gray-200 dark:bg-gray-700 border-r ${index % 2 === 0 ? 'border-r' : ''}`}>{key}</div>
                                        <div className="text-muted-foreground p-3">{Array.isArray(value) ? value.join(', ') : value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                  </>
                )}

                {specificationItems.length > 0 && (
                    <div className="space-y-3">
                        <Separator />
                        <h2 className="text-md font-semibold">Specifications</h2>
                        <div className="space-y-1 text-sm">
                            {specificationItems.map((item, index) => (
                                item && <div key={index}>
                                    <span className="font-medium">{item.key}:</span>
                                    <span className="text-muted-foreground ml-2">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="pt-4">
                    <Button asChild size="lg" className="bg-green-500 hover:bg-green-600 rounded-full text-white">
                        <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer">
                          <WhatsAppIcon className="mr-2 h-5 w-5"/>
                          Share on WhatsApp
                        </a>
                    </Button>
                </div>

            </div>
        </div>

        {relatedProducts.length > 0 && (
             <div className="mt-16 lg:mt-24">
                <h2 className="text-2xl font-bold mb-6">Related Items</h2>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
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
