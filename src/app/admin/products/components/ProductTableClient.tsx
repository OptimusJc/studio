'use client';

import { useState } from 'react';
import type { Product } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Share2, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

function RowActions({ product }: { product: Product }) {
  const { toast } = useToast();
  const [isShareOpen, setShareOpen] = useState(false);

  const createShareLink = () => {
    if (typeof window === 'undefined') return '';
    const filters = {
      category: [product.category],
    };
    const encodedFilters = btoa(JSON.stringify(filters));
    return `${window.location.origin}/catalog?filters=${encodedFilters}`;
  };

  const shareLink = createShareLink();

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      toast({
        title: "Link Copied!",
        description: "The shareable link has been copied to your clipboard.",
      });
      setShareOpen(false);
    }).catch(err => {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Could not copy the link. Please try again.",
      });
    });
  };

  return (
    <Dialog open={isShareOpen} onOpenChange={setShareOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem>Edit Product</DropdownMenuItem>
          <DropdownMenuItem>View Details</DropdownMenuItem>
          <DialogTrigger asChild>
            <DropdownMenuItem>
              <Share2 className="mr-2 h-4 w-4" />
              Share View
            </DropdownMenuItem>
          </DialogTrigger>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">Delete Product</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Filtered View</DialogTitle>
          <DialogDescription>
            This link will take users to the catalog with a filter for '{product.category}' applied.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Input id="link" defaultValue={shareLink} readOnly />
          </div>
          <Button type="submit" size="sm" className="px-3" onClick={handleCopy}>
            <span className="sr-only">Copy</span>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ProductTableClient({ products }: { products: Product[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]">
            <Checkbox />
          </TableHead>
          <TableHead className="w-[80px]">Image</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead className="w-[40px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell>
              <Checkbox />
            </TableCell>
            <TableCell>
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={48}
                height={48}
                className="rounded-md object-cover"
                data-ai-hint={product.imageHint}
              />
            </TableCell>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>
              <Badge variant={product.status === 'Published' ? 'default' : 'outline'} className={product.status === 'Published' ? 'bg-accent text-accent-foreground' : ''}>
                {product.status}
              </Badge>
            </TableCell>
            <TableCell className='font-code'>{product.sku}</TableCell>
            <TableCell>{product.stock}</TableCell>
            <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
            <TableCell>
              <RowActions product={product} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
