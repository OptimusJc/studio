
'use client';

import React from 'react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScreenshotButtonProps {
  elementRef: React.RefObject<HTMLElement>;
  fileName?: string;
}

export function ScreenshotButton({ elementRef, fileName = 'product-details.png' }: ScreenshotButtonProps) {
  const { toast } = useToast();

  const handleScreenshot = async () => {
    if (!elementRef.current) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not find the element to capture.',
      });
      return;
    }

    const { id, update } = toast({ variant: 'loading', title: 'Capturing Screenshot...', description: 'Please wait a moment.' });
    
    try {
      const canvas = await html2canvas(elementRef.current, {
        allowTaint: true,
        useCORS: true,
        scale: 2, // Increase resolution for better quality
        backgroundColor: window.getComputedStyle(document.body).backgroundColor,
        onclone: (document) => {
          // Find the header inside the cloned document and remove its shadow
          const header = document.querySelector('header');
          if (header) {
              header.style.boxShadow = 'none';
              header.style.borderBottom = 'none';
          }
        }
      });
      
      const image = canvas.toDataURL('image/png', 1.0);
      
      const link = document.createElement('a');
      link.href = image;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      update({ id, variant: 'success', title: 'Screenshot Saved!', description: 'Your image has been downloaded.' });

    } catch (error) {
      update({ id, variant: 'destructive', title: 'Screenshot Failed', description: (error as Error).message || 'An unknown error occurred.' });
      console.error('Failed to take screenshot:', error);
    }
  };

  return (
    <Button
      onClick={handleScreenshot}
      variant="outline"
      size="lg"
      className="w-full sm:w-auto rounded-full"
    >
      <Camera className="mr-2 h-5 w-5" />
      Screenshot
    </Button>
  );
}
