
'use client';

import type { Product } from '@/types';
import Image from 'next/image';
import { Globe } from 'lucide-react';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface WhatsAppPreviewProps {
  product: Product;
}

export function WhatsAppPreview({ product }: WhatsAppPreviewProps) {
  const [domain, setDomain] = React.useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setDomain(window.location.hostname);
    }
  }, []);

  const message = `*Product Inquiry*\n\nHello, I'm interested in this product. Could you please confirm its availability and price?\n\n*Product Details:*\nCode: *${product.productCode}*\nTitle: ${product.productTitle}\n\nLink: ${typeof window !== 'undefined' ? window.location.href : ''}`;

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
                        <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
                            <Image 
                                src={product.imageUrl} 
                                alt={product.name} 
                                fill
                                sizes="64px"
                                className="object-cover"
                            />
                        </div>
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
