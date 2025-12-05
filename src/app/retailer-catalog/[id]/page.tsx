
import * as React from "react";
import { Suspense } from "react";
import { ProductDetailPageClient } from "../components/ProductDetailClient";
import { Skeleton } from "@/components/ui/skeleton";
import ProductDetailHeader from "../components/ProductDetailHeader";
import { generateMetadata as generateProductMetadata } from '@/lib/metadata';

export async function generateMetadata({ params }: { params: { id: string }}) {
  return generateProductMetadata({ params, db: 'retailers' });
}

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


export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  // This is a Server Component. It can be async.
  // It fetches the data and passes it to the client component.
  return (
    <div className="bg-muted/40 min-h-screen">
      <ProductDetailHeader basePath="/retailer-catalog" />
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductDetailPageClient params={params} />
      </Suspense>
    </div>
  );
}
