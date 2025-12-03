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
  const [productUrl, setProductUrl] = React.useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      setDomain(window.location.hostname);
      
      // Build the product URL
      const basePath = product.db === 'buyers' ? '/shop' : '/retailer-catalog';
      const fullProductUrl = `${origin}${basePath}/${product.id}`;
      setProductUrl(fullProductUrl);
      
      // Build the WhatsApp message with clean image URL
      let msg = '';
      
      // Include clean image URL FIRST for WhatsApp link preview (no token with public storage)
      if (product.productImages && product.productImages[0]) {
        // Remove token from Firebase Storage URL for cleaner WhatsApp preview
        const cleanImageUrl = product.productImages[0].split('?')[0] + '?alt=media';
        msg += `${cleanImageUrl}\n\n`;
      }
      
      msg += `*Product Inquiry*\n\n`;
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

  // Use the original image URL or fallback to placeholder
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
            {/* WhatsApp Message Bubble */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-sm">
              {/* Link Preview Card */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-2 mb-2 border-l-4 border-green-500">
                  <div className="flex items-start gap-2">
                      <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
                          <Image 
                              src={imageUrl} 
                              alt={product.name} 
                              fill
                              sizes="64px"
                              className="object-cover"
                              unoptimized // Don't optimize external images
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
              
              {/* Message Text */}
              <div className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">
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
              
              {/* Timestamp */}
              <div className="text-right text-xs text-gray-400 mt-1">
                  10:30 AM
              </div>
            </div>
            
            {/* Copy Message Button (Optional) */}
            <div className="mt-3 text-center">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(message);
                }}
                className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
              >
                Copy message text
              </button>
            </div>
        </div>
    </div>
  );
}