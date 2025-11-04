import Image from 'next/image';
import type { Product } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="group relative flex flex-col overflow-hidden h-full border-none shadow-md hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <div className="aspect-[4/3] relative">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover rounded-t-lg"
          data-ai-hint={product.imageHint}
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex flex-col gap-2">
                <Link href={`/shop/${product.id}`} legacyBehavior>
                    <a className="w-full">
                        <Button variant="destructive" className="bg-red-600 hover:bg-red-700 w-32">See Preview</Button>
                    </a>
                </Link>
                <Button variant="secondary" className="w-32">Similar Items</Button>
            </div>
        </div>
      </div>
      <CardContent className="p-4 flex-grow flex flex-col bg-card rounded-b-lg">
        <h3 className="text-md font-bold">{product.productCode}</h3>
        <p className="text-sm text-muted-foreground flex-grow line-clamp-2">{product.productDescription}</p>
        <div className="text-xs text-muted-foreground mt-2">Dimensions: {product.specifications || 'N/A'}</div>
        <div className="mt-4">
            <Badge variant="outline">Premium Quality</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
