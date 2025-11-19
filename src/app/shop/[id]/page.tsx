
'use client';

import * as React from 'react';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs, where, limit, DocumentData, doc, getDoc } from 'firebase/firestore';
import type { Product, Category } from '@/types';
import ProductCard from '@/app/retailer-catalog/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { WhatsAppIcon } from '@/components/icons/WhatsappIcon';
import Link from 'next/link';
import ProductDetailHeader from '@/app/retailer-catalog/components/ProductDetailHeader';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
    return product.specifications.split(',').map(item => {
        const parts = item.split(':');
        if (parts.length === 2) {
            return { key: parts[0].trim(), value: parts[1].trim() };
        }
        return { key: item.trim(), value: '' }; // Handle items without a colon
    }).filter(item => item.key);
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
    
    if (product.attributes && Object.keys(product.attributes).length > 0) {
      message += `\n*Attributes:*\n`;
      Object.entries(product.attributes).forEach(([key, value]) => {
        const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
        const formattedValue = Array.isArray(value) ? value.join(', ') : value;
        message += `${formattedKey}: ${formattedValue}\n`;
      });
    }

    if (typeof window !== 'undefined') {
        message += `\nLink: ${window.location.href}`;
    }

    return encodeURIComponent(message);
  };
  
  const whatsAppUrl = `https://wa.me/?text=${generateWhatsAppMessage()}`;


  return (
    <>
      <ProductDetailHeader basePath="/shop"/>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground/50">
                <Link href="/shop" prefetch={false}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Shop
                </Link>
            </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 lg:gap-10">
    {/* Image Section */}
    <div className="flex flex-col md:flex-row gap-4">
        {/* Thumbnail Gallery - Left side on desktop, top on mobile */}
        <div className="flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-y-auto pb-2 md:pb-0 px-1 md:w-24 flex-shrink-0 order-2 md:order-1">
            {allImages.map((img, index) => (
                <div 
                    key={index} 
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${activeImage === img ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
                    onClick={() => setActiveImage(img)}
                >
                    <Image 
                        src={img} 
                        alt={`${product.name} thumbnail ${index + 1}`} 
                        width={80} 
                        height={80} 
                        className="object-cover w-full h-full"
                    />
                </div>
            ))}
        </div>
        
        {/* Main Image */}
        <div className="flex-grow order-1 md:order-2">
            <div className="bg-gray-200 dark:bg-gray-800/50 rounded-2xl py-4 md:p-4 h-full flex items-center justify-center">
                <div className="aspect-[5/4] w-full max-w-2xl rounded-xl overflow-hidden bg-muted relative">
                    {activeImage && (
                        <Image 
                            src={activeImage} 
                            alt={product.name} 
                            fill 
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            className="object-cover" 
                            priority 
                        />
                    )}
                </div>
            </div>
        </div>
    </div>

    {/* Product Details Section */}
    <div className="space-y-6">
        {/* Title and Price */}
        <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-mono">{product.productCode}</h1>
            <p className="mt-2 text-base sm:text-lg text-muted-foreground">{product.productTitle}</p>
             <div className="flex items-baseline gap-4 mt-4">
              {product.price ? (
                  <p className="text-2xl font-bold text-primary">Ksh {product.price.toFixed(2)}</p>
              ) : (
                  <p className="text-lg font-semibold text-muted-foreground">Price on inquiry</p>
              )}
               <Badge variant={product.stockStatus === 'Out of Stock' ? 'destructive' : 'outline'}
               className={cn('text-sm', product.stockStatus === 'In Stock' && "text-green-600 border-green-600/40")}>
                {product.stockStatus}
              </Badge>
            </div>
        </div>
        
        {/* Product Description */}
        {product.productDescription && (
            <div>
                <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-2">Description</h2>
                <p className="text-sm leading-relaxed text-foreground/80">{product.productDescription}</p>
            </div>
        )}
        
        {/* Attributes/Details */}
        {Object.keys(product.attributes).length > 0 && (
            <>
                <Separator />
                <div>
                    <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-3">Details</h2>
                    <div className="border rounded-lg overflow-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                            {Object.entries(product.attributes).map(([key, value], index) => (
                                <div key={key} className="grid grid-cols-2 text-sm border-b last:border-b-0 lg:border-b lg:last:border-b-0 lg:even:border-l">
                                    <div className="font-medium capitalize p-3 bg-gray-100 dark:bg-gray-800">{key}</div>
                                    <div className="text-muted-foreground p-3 bg-white dark:bg-gray-900">{Array.isArray(value) ? value.join(', ') : value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </>
        )}

        {/* Specifications */}
        {specificationItems.length > 0 && (
            <>
                <Separator />
                <div>
                    <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-3">Specifications</h2>
                     <div className="flex flex-wrap gap-2">
                        {specificationItems.map((item, index) => (
                            item && (
                                <Badge key={index} variant="secondary" className="text-sm bg-gray-200">
                                  <span className="font-medium">{item.key}</span>
                                  {item.value && <span className="text-muted-foreground ml-1.5">{item.value}</span>}
                                </Badge>
                            )
                        ))}
                    </div>
                </div>
            </>
        )}
        
        {/* WhatsApp Button */}
        <div className="pt-4">
            <Button 
                asChild 
                size="lg" 
                className="w-full sm:w-auto bg-green-500 hover:bg-green-600 rounded-full text-white"
                disabled={product.stockStatus === 'Out of Stock'}
            >
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
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                     {relatedProducts.map(related => (
                        <ProductCard key={related.id} product={related} basePath="/shop" />
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
