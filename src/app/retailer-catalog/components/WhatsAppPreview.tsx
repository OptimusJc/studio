
'use client';

import React from 'react';
import type { Product } from '@/types';
import Image from 'next/image';
import { Globe } from 'lucide-react';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getPublicUrl } from '@/lib/storage-utils';

interface WhatsAppPreviewProps {
  product: Product;
}

export function WhatsAppPreview({ product }: WhatsAppPreviewProps) {
  const [domain, setDomain] = React.useState('');
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      setDomain(window.location.hostname);
      
      const basePath = product.db === 'buyers' ? '/shop' : '/retailer-catalog';
      const fullProductUrl = `${origin}${basePath}/${product.id}`;
      
      const publicImageUrl = getPublicUrl(product.productImages?.[0]);

      let msg = '';
      if (publicImageUrl) {
        msg += `${publicImageUrl}\n\n`;
      }
      
      msg += `*Product Inquiry*\n\n`;
      msg += `I'm interested in this product:\n`;
      msg += `*${product.productTitle}*\n`;
      msg += `Code: _${product.productCode}_\n\n`;
      
      if (product.price) {
        msg += `Price: *Ksh ${product.price.toFixed(2)}*\n\n`;
      }

      msg += `Could you please confirm its availability?`;
      
      setMessage(msg);
    }
  }, [product]);

  const imageUrl = product.productImages?.[0] || product.imageUrl || 'https://placehold.co/600x600';

  return (
    <div className="bg-[#E5DDD5] p-4 rounded-lg font-sans">
        <DialogHeader className="mb-4">
          <DialogTitle>WhatsApp Preview</DialogTitle>
          <DialogDescription>
            This is how your message will appear when shared on WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="w-full max-w-sm mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-sm">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 mb-2 border-l-4 border-green-500">
                  <div className="flex items-start gap-2">
                      <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
                          <Image 
                              src={imageUrl} 
                              alt={product.name} 
                              fill
                              sizes="64px"
                              className="object-cover"
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
              
              <div className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">
                  {message.split('\n').map((line, index) => {
                    const boldRegex = /\*(.*?)\*/g;
                    const italicRegex = /_(.*?)_/g;

                    const parts = line.split(boldRegex).flatMap(part => part.split(italicRegex));
                    
                    return (
                        <p key={index} className="min-h-[1.25rem]">
                          {parts.map((part, i) => {
                            // This logic is simplified; assumes no nesting.
                            // Parts at odd indices after splitting by a delimiter are the captured content.
                            if (line.match(boldRegex) && line.split(boldRegex).indexOf(part) % 2 === 1) {
                              return <strong key={i}>{part}</strong>;
                            }
                            if (line.match(italicRegex) && line.split(italicRegex).indexOf(part) % 2 === 1) {
                               return <em key={i}>{part}</em>;
                            }
                            return part;
                          })}
                        </p>
                    );
                  })}
              </div>
              
              <div className="text-right text-xs text-gray-400 mt-1">
                  10:30 AM
              </div>
            </div>
            
            <div className="mt-3 text-center">
              <button
                onClick={() => navigator.clipboard.writeText(message)}
                className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
              >
                Copy message text
              </button>
            </div>
        </div>
    </div>
  );
}
