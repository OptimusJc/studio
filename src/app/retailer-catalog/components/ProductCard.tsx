
'use client';

import Image from 'next/image';
import type { Product } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ProductPreviewModal } from './ProductPreviewModal';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Ban } from 'lucide-react';

type ProductCardProps = {
  product: Product;
  priority?: boolean;
  basePath: string;
};

export default function ProductCard({ product, priority = false, basePath }: ProductCardProps) {
  const router = useRouter();
  const [isModalOpen, setModalOpen] = useState(false);
  const isOutOfStock = product.stockStatus === 'Out of Stock';

  const handleCardClick = () => {
    if (isOutOfStock) return;
    router.push(`${basePath}/${product.id}`);
  };

  const handleSimilarClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card's onClick from firing
    if (isOutOfStock) return;
    
    const filters = {
      category: [product.category],
    };
    const encodedFilters = btoa(JSON.stringify(filters));
    router.push(`${basePath}?filters=${encodedFilters}`);
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card's onClick from firing
    if (isOutOfStock) return;
    setModalOpen(true);
  };

  return (
    <div
      className={cn(
        "group block h-full",
        isOutOfStock ? "cursor-not-allowed" : "cursor-pointer"
      )}
      onClick={handleCardClick}
    >
      <Card className="flex flex-col overflow-hidden h-full bg-white shadow-sm group-hover:shadow-lg transition-shadow duration-300 rounded-3xl border border-gray-200 relative">
        <div className="aspect-[5/4] relative rounded-t-lg overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              "object-cover transition-transform duration-300 group-hover:scale-105",
              isOutOfStock && "grayscale"
            )}
            data-ai-hint={product.imageHint}
            priority={priority}
          />
           {!isOutOfStock && (
            <div onClick={(e) => e.stopPropagation()} className="absolute inset-0 bg-black/50 flex flex-col justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ProductPreviewModal product={product} open={isModalOpen} onOpenChange={setModalOpen} basePath={basePath}>
                  <Button
                      variant="secondary"
                      className="w-32 rounded-3xl hover:bg-red-600 hover:text-white"
                      onClick={handlePreviewClick}
                      disabled={isOutOfStock}
                  >
                      See Preview
                  </Button>
                </ProductPreviewModal>
                <Button
                variant="secondary"
                className="w-32 rounded-3xl hover:bg-red-600 hover:text-white"
                onClick={handleSimilarClick}
                disabled={isOutOfStock}
                >
                Similar Items
                </Button>
            </div>
           )}
           {isOutOfStock && (
            <div className="absolute inset-0 bg-white/70 dark:bg-black/70 flex flex-col justify-center items-center p-4">
                <Badge variant="destructive" className="text-sm">
                    <Ban className="mr-2 h-4 w-4" />
                    Out of Stock
                </Badge>
            </div>
           )}
        </div>
        <CardContent className="p-3 flex-grow flex flex-col">
          <h3 className="text-base font-bold text-gray-800">{product.productCode}</h3>
          <p className="text-sm text-gray-600 mt-1">{product.productTitle}</p>
          <div className="flex-grow"></div>
          <div className="text-xs text-gray-500 mt-1">Dimensions: {product.specifications || 'N/A'}</div>
          <div className="mt-3">
            <Badge variant="outline" className="border-gray-300 text-gray-600">Premium Quality</Badge>
          </div>
          {product.price ? (
              <p className="text-sm font-semibold text-primary mt-2">Ksh {product.price.toFixed(2)}</p>
          ) : (
              <p className="text-xs text-muted-foreground mt-2">Price on inquiry</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
