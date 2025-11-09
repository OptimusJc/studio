
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
        <Card className="relative flex flex-col overflow-visible h-full bg-white shadow-sm group-hover:shadow-lg transition-shadow duration-300 rounded-3xl border border-gray-200 group-hover:z-10">
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
            <CardContent className="relative p-3 flex-grow flex flex-col bg-white rounded-b-lg">
                <div className="transition-opacity duration-300">
                    <h3 className="text-base font-bold text-gray-800">{product.productCode}</h3>
                    <p className="text-sm text-gray-600 flex-grow mt-1">{product.productTitle}</p>
                    <div className="text-xs text-gray-500 mt-1">Dimensions: {product.specifications || 'N/A'}</div>
                    <div className="mt-3">
                        <Badge variant="outline" className="border-gray-300 text-gray-600">Premium Quality</Badge>
                    </div>
                </div>
                <div className="absolute left-0 right-0 -bottom-1 transform translate-y-full w-full bg-white p-3 rounded-b-3xl shadow-lg border-t border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-auto">
                    <div className="flex justify-center items-center gap-2">
                        <ProductPreviewModal product={product}>
                             <Button
                                variant="secondary"
                                className="w-32 rounded-3xl hover:bg-red-600 hover:text-white"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
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
            </CardContent>
        </Card>
    </Link>
  );
}
