'use client';

import type { Product } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProductViewDialogProps {
  product: Product;
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
    if (!value) return null;
    return (
        <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className="text-base">{value}</div>
        </div>
    )
}

export function ProductViewDialog({ product }: ProductViewDialogProps) {

  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          View Details
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>
            SKU: <span className="font-code">{product.sku}</span>
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pr-6 py-4">
                <div className="space-y-4">
                    <div className="relative aspect-square rounded-lg overflow-hidden border">
                         <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                    </div>
                    {product.additionalImages && product.additionalImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                            {product.additionalImages.map((img, index) => (
                                <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                                    <Image src={img} alt={`${product.name} additional image ${index + 1}`} fill className="object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="space-y-4">
                    <DetailItem label="Description" value={product.productDescription} />
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Price" value={`$${product.price.toFixed(2)}`} />
                        <DetailItem label="Stock" value={product.stock} />
                        <DetailItem label="Category" value={<Badge variant="outline">{product.category}</Badge>} />
                        <DetailItem label="Status" value={<Badge variant={product.status === 'Published' ? 'secondary' : 'outline'}>{product.status}</Badge>} />
                    </div>
                    <Separator />
                     <DetailItem label="Specifications" value={product.specifications} />
                    <Separator />
                    <div>
                         <p className="text-sm font-medium text-muted-foreground mb-2">Attributes</p>
                         <div className="grid grid-cols-2 gap-4">
                            {Object.entries(product.attributes).map(([key, value]) => (
                                <DetailItem key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} value={Array.isArray(value) ? value.join(', ') : value} />
                            ))}
                         </div>
                    </div>
                </div>
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
