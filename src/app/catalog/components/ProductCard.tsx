
'use client';

import Image from 'next/image';
import type { Product } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ProductPreviewModal } from './ProductPreviewModal';
import { useState } from 'react';

type ProductCardProps = {
  product: Product;
  priority?: boolean;
};

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const router = useRouter();
  const [isModalOpen, setModalOpen] = useState(false);

  const handleCardClick = () => {
    router.push(`/catalog/${product.id}`);
  };

  const handleSimilarClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card's onClick from firing
    
    const filters = {
      category: [product.category],
    };
    const encodedFilters = btoa(JSON.stringify(filters));
    router.push(`/catalog?filters=${encodedFilters}`);
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card's onClick from firing
    setModalOpen(true);
  };

  return (
    <div
      className="group block h-full cursor-pointer relative"
      onClick={handleCardClick}
    >
      <Card className="flex flex-col overflow-hidden h-full bg-white shadow-sm group-hover:shadow-lg transition-all duration-300 rounded-3xl border border-gray-200 relative group-hover:z-10 group-hover:scale-105">
        <div className="aspect-[5/4] relative rounded-t-lg overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
            data-ai-hint={product.imageHint}
            priority={priority}
          />
        </div>
        <CardContent className="p-3 flex-grow flex flex-col">
           <div className="opacity-100 transition-opacity duration-300 group-hover:opacity-0">
              <h3 className="text-base font-bold text-gray-800">{product.productCode}</h3>
              <p className="text-sm text-gray-600 flex-grow mt-1">{product.productTitle}</p>
              <div className="text-xs text-gray-500 mt-1">Dimensions: {product.specifications || 'N/A'}</div>
              <div className="mt-3">
                <Badge variant="outline" className="border-gray-300 text-gray-600">Premium Quality</Badge>
              </div>
           </div>
        </CardContent>
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/80 backdrop-blur-sm rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <div className="flex flex-row justify-center items-center gap-2">
                 <ProductPreviewModal product={product} open={isModalOpen} onOpenChange={setModalOpen}>
                    <Button
                        variant="secondary"
                        className="w-32 rounded-3xl hover:bg-red-600 hover:text-white"
                        onClick={handlePreviewClick}
                    >
                        See Preview
                    </Button>
                </ProductPreviewModal>
                <Button
                    variant="secondary"
                    className="w-32 rounded-3xl hover:bg-red-600 hover:text-white"
                    onClick={handleSimilarClick}
                >
                    Similar Items
                </Button>
             </div>
        </div>
      </Card>
    </div>
  );
}
