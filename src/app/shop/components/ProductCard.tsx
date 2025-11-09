
'use client';

import Image from 'next/image';
import type { Product } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProductPreviewModal } from './ProductPreviewModal';

type ProductCardProps = {
  product: Product;
  priority?: boolean;
};

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const router = useRouter();

  const handleSimilarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const filters = {
      category: [product.category],
    };
    const encodedFilters = btoa(JSON.stringify(filters));
    router.push(`/shop?filters=${encodedFilters}`);
  };

  return (
    <Link href={`/shop/${product.id}`} className="group block h-full" prefetch={false}>
        <Card className="relative flex flex-col overflow-hidden h-full bg-white shadow-sm group-hover:shadow-lg transition-shadow duration-300 rounded-3xl border border-gray-200">
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
                <div className="absolute inset-0 bg-black/40 hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex flex-col gap-2">
                        <ProductPreviewModal product={product}>
                             <Button
                                variant="secondary"
                                className="w-32 rounded-lg"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                             >
                                See Preview
                             </Button>
                        </ProductPreviewModal>
                        <Button
                            variant="secondary"
                            className="w-32 rounded-lg"
                            onClick={handleSimilarClick}
                        >
                            Similar Items
                        </Button>
                    </div>
                </div>
            </div>
            <CardContent className="p-3 flex-grow flex flex-col bg-white rounded-b-lg">
                <h3 className="text-base font-bold text-gray-800">{product.productCode}</h3>
                <p className="text-sm text-gray-600 flex-grow mt-1">{product.productTitle}</p>
                <div className="text-xs text-gray-500 mt-1">Dimensions: {product.specifications || 'N/A'}</div>
                <div className="mt-3">
                    <Badge variant="outline" className="border-gray-300 text-gray-600">Premium Quality</Badge>
                </div>
            </CardContent>
        </Card>
    </Link>
  );
}
