'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

interface ImageSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelectImage: (imageUrl: string) => void;
}

export function ImageSelectionDialog({
  isOpen,
  onOpenChange,
  onSelectImage,
}: ImageSelectionDialogProps) {
  const handleImageClick = (imageUrl: string) => {
    onSelectImage(imageUrl);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Select an Image</DialogTitle>
          <DialogDescription>
            Choose a placeholder image for your product.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {PlaceHolderImages.map((image) => (
              <div
                key={image.id}
                className="cursor-pointer group relative"
                onClick={() => handleImageClick(image.imageUrl)}
              >
                <Image
                  src={image.imageUrl}
                  alt={image.description}
                  width={200}
                  height={200}
                  className="rounded-md object-cover aspect-square transition-transform duration-200 group-hover:scale-105"
                  data-ai-hint={image.imageHint}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <p className="text-white text-center text-sm font-semibold">Select</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
