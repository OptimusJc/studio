

'use client';

import React from 'react';
import type { Product } from '@/types';
import Image from 'next/image';
import { Globe } from 'lucide-react';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface WhatsAppPreviewProps {
  product: Product;
}

export function WhatsAppPreview({ product }: WhatsAppPreviewProps) {
  const [domain, setDomain] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [proxyImageUrl, setProxyImageUrl] = React.useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      setDomain(window.location.hostname);

      if (product.imageUrl) {
        // Construct the absolute proxy URL for the visual preview inside the dialog.
        setProxyImageUrl(`${origin}/api/image-proxy?url=${encodeURIComponent(product.imageUrl)}`);
      }
      
      let msg = `*Product Inquiry*\n\n`;
      msg += `Hello, I'm interested in this product:\n\n`;
      msg += `*${product.productTitle}*\n`;
      msg += `Code: *${product.productCode}*\n\n`;
      msg += `Could you please confirm its availability and price?\n\n`;
      msg += `From: ${origin}${product.db === 'buyers' ? '/shop' : '/retailer-catalog'}/${product.id}`;
      
      setMessage(msg);
    }
  }, [product]);

  return (
    <div className="bg-[#E5DDD5] p-4 rounded-lg font-sans">
        <DialogHeader className="mb-4">
          <DialogTitle>WhatsApp Preview</DialogTitle>
          <DialogDescription>
            This is how the message will look when shared on WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="w-full max-w-sm mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-sm">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 flex items-start gap-2 border-l-4 border-green-500">
                <div className="flex-grow">
                    <div className="flex items-center gap-2">
                        {proxyImageUrl && (
                            <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
                                <Image 
                                    src={proxyImageUrl} 
                                    alt={product.name} 
                                    fill
                                    sizes="64px"
                                    className="object-cover"
                                />
                            </div>
                        )}
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-2">{product.productTitle}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <Globe className="h-3 w-3"/>
                                <span>{domain}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-2 whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">
                {message.split('\n').map((line, index) => {
                  const boldRegex = /\*(.*?)\*/g;
                  const parts = line.split(boldRegex);
                  
                  return (
                      <p key={index} className="min-h-[1.25rem]">
                      {parts.map((part, i) => 
                          i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                      )}
                      </p>
                  );
                })}
            </div>
            <div className="text-right text-xs text-gray-400 mt-1">
                10:30 AM
            </div>
            </div>
        </div>
    </div>
  );
}
