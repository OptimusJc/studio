
import Image from 'next/image';
import type { Product } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type ProductCardProps = {
  product: Product;
};

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden h-full transition-shadow duration-300 hover:shadow-xl">
      <CardHeader className="p-0">
        <div className="aspect-square relative">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            data-ai-hint={product.imageHint}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className='flex justify-between items-center mb-2'>
            <Badge variant="secondary">{product.category}</Badge>
            {product.attributes.brand && <Badge variant="outline">{product.attributes.brand as string}</Badge>}
        </div>
        <CardTitle className="text-lg font-semibold leading-snug">{product.name}</CardTitle>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center">
        <p className="text-xl font-bold text-primary">${(product.price ?? 0).toFixed(2)}</p>
        <Button variant="outline">View</Button>
      </CardFooter>
    </Card>
  );
}
