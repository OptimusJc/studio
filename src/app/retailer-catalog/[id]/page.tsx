
"use client";

import * as React from "react";
import { Suspense, useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import {
  collection,
  query,
  getDocs,
  where,
  limit,
  DocumentData,
  doc,
  getDoc,
} from "firebase/firestore";
import type { Product, Category } from "@/types";
import ProductCard from "../components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { WhatsAppIcon, Eye } from "@/components/icons/WhatsappIcon";
import Link from "next/link";
import ProductDetailHeader from "../components/ProductDetailHeader";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { WhatsAppPreview } from "../components/WhatsAppPreview";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

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

function ProductDetailPageContent({ params }: { params: { id: string } }) {
  const firestore = useFirestore();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>("");

  const categoriesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "categories");
  }, [firestore]);
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useCollection<Category>(categoriesCollection);

  useEffect(() => {
    if (!firestore || !productId) return;

    const findProduct = async () => {
      setIsLoading(true);

      const allCollections =
        categoriesData?.map((cat) => {
          const categorySlug = cat.name.toLowerCase().replace(/\s+/g, "-");
          return {
            path: `retailers/${categorySlug}/products`,
            category: cat.name,
          };
        }) || [];

      const fetchPromises = allCollections.map((col) =>
        getDoc(doc(firestore, col.path, productId)),
      );

      const results = await Promise.allSettled(fetchPromises);

      let foundProduct: Product | null = null;
      let productCategoryName: string | null = null;

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === "fulfilled" && result.value.exists()) {
          const productDoc = result.value;
          const data = productDoc.data() as DocumentData;
          if (data.status === "Published") {
            foundProduct = {
              id: productDoc.id,
              ...data,
              name: data.productTitle,
              imageUrl:
                data.productImages?.[0] || "https://placehold.co/600x600",
              category: allCollections[i].category,
              db: "retailers",
            } as Product;
            productCategoryName = allCollections[i].category;
            break;
          }
        }
      }

      if (foundProduct) {
        setProduct(foundProduct);
        setActiveImage(foundProduct.productImages?.[0] || "");

        if (productCategoryName) {
          const categorySlug = productCategoryName
            .toLowerCase()
            .replace(/\s+/g, "-");
          const relatedCollectionPath = `retailers/${categorySlug}/products`;
          const q = query(
            collection(firestore, relatedCollectionPath),
            where("status", "==", "Published"),
            limit(7),
          );
          const querySnapshot = await getDocs(q);
          const fetchedRelated: Product[] = [];
          querySnapshot.forEach((doc) => {
            if (doc.id !== productId) {
              const data = doc.data() as DocumentData;
              fetchedRelated.push({
                id: doc.id,
                ...data,
                name: data.productTitle,
                imageUrl:
                  data.productImages?.[0] || "https://placehold.co/600x600",
                category: productCategoryName,
                db: "retailers",
              } as Product);
            }
          });
          setRelatedProducts(fetchedRelated.slice(0, 6));
        }
      } else {
        console.warn(
          `Published product with ID ${productId} not found in 'retailers' database.`,
        );
      }
      setIsLoading(false);
    };

    if (!isLoadingCategories) {
      findProduct();
    }
  }, [firestore, productId, categoriesData, isLoadingCategories]);

  const allImages = useMemo(() => {
    if (!product) return [];
    return [
      ...(product.productImages || []),
      ...(product.additionalImages || []),
    ];
  }, [product]);

  const specificationItems = useMemo(() => {
    if (!product || !product.specifications) return [];
    return product.specifications
      .split(",")
      .map((item) => {
        const parts = item.split(":");
        if (parts.length === 2) {
          return { key: parts[0].trim(), value: parts[1].trim() };
        }
        return { key: item.trim(), value: "" };
      })
      .filter((item) => item.key);
  }, [product]);

  if (isLoading || isLoadingCategories) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] bg-background">
        <h2 className="text-2xl font-semibold text-muted-foreground">
          Product Not Found
        </h2>
        <p className="text-muted-foreground mt-2">
          The product you are looking for does not exist or is not available.
        </p>
        <Button
          onClick={() => router.push("/retailer-catalog")}
          className="mt-6"
        >
          Back to Catalog
        </Button>
      </div>
    );
  }

  const generateWhatsAppMessage = () => {
    let message = `*Product Inquiry*\n\n`;
    message += `Hello, I'm interested in this product. Could you please confirm its availability and price?\n\n`;
    message += `*Product Details:*\n`;
    message += `Code: *${product.productCode}*\n`;
    message += `Title: ${product.productTitle}\n`;

    if (typeof window !== "undefined") {
      const basePath =
        product.db === "buyers" ? "/shop" : "/retailer-catalog";
      message += `\nLink: ${window.location.origin}${basePath}/${product.id}`;
    }

    return encodeURIComponent(message);
  };

  const whatsAppUrl = `https://wa.me/?text=${generateWhatsAppMessage()}`;

  return (
    <>
      <ProductDetailHeader basePath="/retailer-catalog" />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            asChild
            className="text-muted-foreground hover:text-foreground/50"
          >
            <Link href="/retailer-catalog" prefetch={false}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Catalog
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
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${activeImage === img ? "border-primary ring-2 ring-primary/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}
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
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-mono">
                {product.productCode}
              </h1>
              <p className="mt-2 text-base sm:text-lg text-muted-foreground">
                {product.productTitle}
              </p>
              <div className="flex items-baseline gap-4 mt-4">
                {product.price ? (
                  <p className="text-2xl font-bold text-primary">
                    Ksh {product.price.toFixed(2)}
                  </p>
                ) : (
                  <p className="text-lg font-semibold text-muted-foreground">
                    0.00
                  </p>
                )}
                <Badge
                  variant={
                    product.stockStatus === "Out of Stock"
                      ? "destructive"
                      : "outline"
                  }
                  className={cn(
                    "text-sm",
                    product.stockStatus === "In Stock" &&
                      "text-green-600 border-green-600/40",
                  )}
                >
                  {product.stockStatus}
                </Badge>
              </div>
            </div>

            {/* Product Description */}
            {product.productDescription && (
              <div>
                <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-2">
                  Description
                </h2>
                <p className="text-sm leading-relaxed text-foreground/80">
                  {product.productDescription}
                </p>
              </div>
            )}

            {/* Attributes/Details */}
            {Object.keys(product.attributes).length > 0 && (
              <>
                <Separator />
                <div>
                  <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-3">
                    Details
                  </h2>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                      {Object.entries(product.attributes).map(
                        ([key, value], index) => (
                          <div
                            key={key}
                            className="grid grid-cols-2 text-sm border-b last:border-b-0 lg:border-b lg:last:border-b-0 lg:even:border-l"
                          >
                            <div className="font-medium capitalize p-3 bg-gray-100 dark:bg-gray-800">
                              {key}
                            </div>
                            <div className="text-muted-foreground p-3 bg-white dark:bg-gray-900">
                              {Array.isArray(value) ? value.join(", ") : value}
                            </div>
                          </div>
                        ),
                      )}
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
                  <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-3">
                    Specifications
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {specificationItems.map(
                      (item, index) =>
                        item && (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-sm bg-gray-200"
                          >
                            <span className="font-medium">{item.key}</span>
                            {item.value && (
                              <span className="text-muted-foreground ml-1.5">
                                {item.value}
                              </span>
                            )}
                          </Badge>
                        ),
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="pt-4 flex flex-wrap items-center gap-2">
              <Button
                asChild
                size="lg"
                className="flex-1 bg-green-500 hover:bg-green-600 rounded-full text-white"
                disabled={product.stockStatus === "Out of Stock"}
              >
                <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="mr-2 h-5 w-5" />
                  Share on WhatsApp
                </a>
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 rounded-full"
                    disabled={product.stockStatus === "Out of Stock"}
                  >
                    <Eye className="mr-2 h-5 w-5" />
                    WhatsApp Preview
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <WhatsAppPreview product={product} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-16 lg:mt-24">
            <h2 className="text-2xl font-bold mb-6">Related Items</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {relatedProducts.map((related) => (
                <ProductCard
                  key={related.id}
                  product={related}
                  basePath="/retailer-catalog"
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="bg-muted/40 min-h-screen">
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetailPageContent params={params} />
      </Suspense>
    </div>
  );
}
