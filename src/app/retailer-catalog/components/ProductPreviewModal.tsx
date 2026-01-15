
"use client";

import * as React from "react";
import type { Product } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WhatsAppIcon } from "@/components/icons/WhatsappIcon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductPreviewModalProps {
  product: Product;
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  basePath: string;
}

export function ProductPreviewModal({
  product,
  children,
  open,
  onOpenChange,
  basePath,
}: ProductPreviewModalProps) {
  const [activeImage, setActiveImage] = React.useState<string>(
    product.productImages?.[0] || "",
  );
  const [whatsAppUrl, setWhatsAppUrl] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setActiveImage(product.productImages?.[0] || "");

      const generateWhatsAppMessage = () => {
        const productUrl = `${window.location.origin}${basePath}/${product.id}`;
        let message = `*Product Inquiry*\n\n`;
        message += `Hello, I'm interested in this product. Could you please confirm its availability and price?\n\n`;
        message += `*Product Details:*\n`;
        message += `Code: *${product.productCode}*\n`;
        message += `Title: ${product.productTitle}\n`;
        
        message += `\nView Product: ${productUrl}`;

        return encodeURIComponent(message);
      };

      setWhatsAppUrl(`https://wa.me/?text=${generateWhatsAppMessage()}`);
    }
  }, [open, product, basePath]);

  const allImages = React.useMemo(() => {
    if (!product) return [];
    return [
      ...(product.productImages || []),
      ...(product.additionalImages || []),
    ];
  }, [product]);

  const specificationItems = React.useMemo(() => {
    if (!product || !product.specifications) return [];
    return product.specifications
      .split(";")
      .map((item) => {
        const parts = item.split(":");
        if (parts.length === 2) {
          return { key: parts[0].trim(), value: parts[1].trim() };
        }
        return null;
      })
      .filter(Boolean);
  }, [product]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent
        className="max-w-4xl h-[60vh] flex flex-col p-0 bg-white"
        onPointerDownOutside={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onOpenChange(false);
        }}
        onInteractOutside={(e) => {
          e.stopPropagation();
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onEscapeKeyDown={(e) => {
          e.stopPropagation();
        }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Product Preview: {product.name}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-grow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="p-6 flex flex-col gap-4">
              <div className="aspect-[5/4] w-full rounded-xl overflow-hidden bg-muted relative">
                {activeImage && (
                  <Image
                    src={activeImage}
                    alt={product.name}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    priority
                  />
                )}
              </div>
              <div className="grid grid-cols-5 gap-3">
                {allImages.map((img, index) => (
                  <div
                    key={index}
                    className={`aspect-square w-full rounded-lg overflow-hidden border-2 cursor-pointer ${activeImage === img ? "border-primary" : "border-transparent"}`}
                    onClick={() => setActiveImage(img)}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      width={100}
                      height={100}
                      unoptimized
                      className="object-cover w-full h-full"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h1 className="text-3xl font-bold font-mono">
                  {product.productCode}
                </h1>
                <p className="mt-1 text-lg text-muted-foreground">
                  {product.productTitle}
                </p>
              </div>

              {product.productDescription && (
                <div>
                  <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
                    Description
                  </h2>
                  <p className="mt-1 text-sm text-foreground/80">
                    {product.productDescription}
                  </p>
                </div>
              )}

              {Object.keys(product.attributes).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-3">
                      Details
                    </h2>
                    <div className="border rounded-lg overflow-hidden">
                      <div
                        className={cn(
                          "grid grid-cols-1 gap-0",
                          Object.keys(product.attributes).length > 1 &&
                            "md:grid-cols-2"
                        )}
                      >
                        {Object.entries(product.attributes).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="grid grid-cols-2 text-sm border-b last:border-b-0 md:border-b md:last:border-b-0 md:[&:nth-child(even)]:border-l"
                            >
                              <div className="font-medium capitalize p-3 bg-gray-100 dark:bg-gray-800">
                                {key}
                              </div>
                              <div className="text-muted-foreground p-3 bg-white dark:bg-gray-900">
                                {Array.isArray(value)
                                  ? value.join(", ")
                                  : value}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {specificationItems.length > 0 && (
                <div className="space-y-3">
                  <Separator />
                  <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
                    Specifications
                  </h2>
                  <div className="space-y-1 text-sm">
                    {specificationItems.map(
                      (item, index) =>
                        item && (
                          <div key={index}>
                            <span className="font-medium">{item.key}:</span>
                            <span className="text-muted-foreground ml-2">
                              {item.value}
                            </span>
                          </div>
                        ),
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-green-500 hover:bg-green-600 rounded-full text-white"
                >
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <WhatsAppIcon className="mr-2 h-5 w-5" />
                    Share on WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
