
'use client';

import React from 'react';
import type { Product } from '@/types';
import Image from 'next/image';
import { Globe } from 'lucide-react';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface WhatsAppPreviewProps {
  product: Product;
}

export function WhatsAppPreview({ product }: WhatsAppPreviewProps) {
  const [domain, setDomain] = React.useState('');
  const [message, setMessage] = React.useState('');
  const { toast } = useToast();
  const [baseUrl, setBaseUrl] = React.useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      setBaseUrl(origin);
      setDomain(window.location.hostname);
      
      const basePath = product.db === 'buyers' ? '/shop' : '/retailer-catalog';
      const fullProductUrl = `${origin}${basePath}/${product.id}`;
      
      let msg = `*Product Inquiry*\n\n`;
      msg += `Hello, I'm interested in this product:\n\n`;
      msg += `*${product.productTitle}*\n`;
      msg += `Code: *${product.productCode}*\n`;
      
      if (product.attributes && Object.keys(product.attributes).length > 0) {
        msg += `\n*Key Details:*\n`;
        Object.entries(product.attributes).slice(0, 3).forEach(([key, value]) => {
          const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
          const formattedValue = Array.isArray(value) ? value.join(', ') : value;
          msg += `${formattedKey}: ${formattedValue}\n`;
        });
      }
      
      msg += `\nCould you please confirm its availability and price?\n\n`;
      msg += `View full details: ${fullProductUrl}`;
      
      setMessage(msg);
    }
  }, [product]);

  const rawImageUrl = product.productImages?.[0] || product.imageUrl || 'https://placehold.co/600x600';
  const proxiedImageUrl = baseUrl ? `${baseUrl}/api/image-proxy?url=${encodeURIComponent(rawImageUrl)}` : rawImageUrl;


  const handleCopy = () => {
    const linkToCopy = `${window.location.origin}/${product.db === 'retailers' ? 'retailer-catalog' : 'shop'}/${product.id}`;
    navigator.clipboard.writeText(linkToCopy).then(() => {
        toast({
            title: "Link Copied!",
            description: "The product link has been copied to your clipboard.",
        });
    }).catch(err => {
        toast({
            variant: "destructive",
            title: "Failed to copy",
            description: "Could not copy the link. Please try again.",
        });
    });
  }

  return (
    <div className="bg-[#E5DDD5] p-4 rounded-lg font-sans">
        <DialogHeader className="mb-4 text-left">
          <DialogTitle>WhatsApp Preview</DialogTitle>
          <DialogDescription>
            This is how your product will appear when shared on WhatsApp. Copy the link below and paste it to share.
          </DialogDescription>
        </DialogHeader>

        <div className="w-full max-w-sm mx-auto">
            {/* WhatsApp Message Bubble */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-0.5 shadow-sm">
              {/* Link Preview Card */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2">
                  <div className="flex items-start gap-2">
                      <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
                          <Image 
                              src={proxiedImageUrl} 
                              alt={product.name} 
                              fill
                              sizes="64px"
                              className="object-cover"
                              unoptimized // We use the proxy, no need for Next.js to optimize
                          />
                      </div>
                      <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-2">
                            {product.productTitle}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <Globe className="h-3 w-3 flex-shrink-0"/>
                              <span className="truncate">{domain}</span>
                          </div>
                      </div>
                  </div>
              </div>
              
              {/* Message Text (Link) */}
              <div className="px-2.5 py-1.5">
                  <p className="text-sm text-blue-600 dark:text-blue-400 break-all">
                    {`${window.location.origin}/${product.db === 'retailers' ? 'retailer-catalog' : 'shop'}/${product.id}`}
                  </p>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <Button
                onClick={handleCopy}
              >
                Copy Link
              </Button>
            </div>
        </div>
    </div>
  );
}
