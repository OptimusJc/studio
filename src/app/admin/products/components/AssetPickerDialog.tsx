
'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useStorage } from '@/firebase';
import { ref, listAll, getDownloadURL, ListResult } from 'firebase/storage';
import { Skeleton } from '@/components/ui/skeleton';
import { Folder, File } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StorageItem {
  name: string;
  path: string;
  type: 'folder' | 'file';
  url?: string;
}

function AssetGridSkeleton() {
    return (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-lg" />
            ))}
        </div>
    )
}

interface AssetPickerDialogProps {
    children: React.ReactNode;
    onAssetSelect: (url: string) => void;
}

export function AssetPickerDialog({ children, onAssetSelect }: AssetPickerDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const storage = useStorage();
  const { toast } = useToast();
  const [items, setItems] = useState<StorageItem[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!storage) return;
    setIsLoading(true);

    const listRef = ref(storage, currentPath);
    try {
      const res: ListResult = await listAll(listRef);
      const folderItems: StorageItem[] = res.prefixes.map(folderRef => ({
        name: folderRef.name,
        path: folderRef.fullPath,
        type: 'folder',
      }));

      const filePromises = res.items
        .filter(itemRef => itemRef.name !== '.gitkeep')
        .map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          return {
            name: itemRef.name,
            path: itemRef.fullPath,
            type: 'file',
            url: url,
          };
      });
      
      const fileItems = await Promise.all(filePromises);

      setItems([...folderItems, ...fileItems]);
    } catch (error) {
      console.error("Error listing storage items:", error);
      toast({ variant: "destructive", title: "Could not load assets", description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [storage, currentPath, toast]);

  useEffect(() => {
    if (isOpen) {
      fetchItems();
    }
  }, [isOpen, fetchItems]);

  const handleFolderClick = (path: string) => {
    setCurrentPath(path);
  };

  const handleBreadcrumbClick = (path: string) => {
    setCurrentPath(path);
  };
  
  const handleFileClick = (url: string) => {
    onAssetSelect(url);
    setIsOpen(false);
  }

  const breadcrumbs = currentPath.split('/').filter(p => p);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Browse Asset Library</DialogTitle>
          <div className="text-sm text-muted-foreground flex items-center gap-1 pt-1">
            <span className="font-medium cursor-pointer hover:underline" onClick={() => handleBreadcrumbClick('')}>Root</span>
            {breadcrumbs.map((crumb, index) => {
                const path = breadcrumbs.slice(0, index + 1).join('/');
                return (
                    <span key={index}>
                        / <span className="font-medium cursor-pointer hover:underline" onClick={() => handleBreadcrumbClick(path)}>{crumb}</span>
                    </span>
                );
            })}
          </div>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-4 -mr-4">
          {isLoading ? <AssetGridSkeleton /> : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {items.map(item => (
                    <div key={item.path} className="group relative">
                        {item.type === 'folder' ? (
                            <div 
                                className="aspect-square w-full bg-muted rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-muted-foreground/20"
                                onClick={() => handleFolderClick(item.path)}
                            >
                                <Folder className="h-12 w-12 text-primary" />
                                <span className="mt-2 text-xs font-medium text-center truncate w-full px-2">{item.name}</span>
                            </div>
                        ) : (
                             <div 
                                className="aspect-square w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden border cursor-pointer"
                                onClick={() => handleFileClick(item.url!)}
                            >
                                {item.url && (item.url.includes('.jpg') || item.url.includes('.jpeg') || item.url.includes('.png') || item.url.includes('.gif') || item.url.includes('.webp')) ? (
                                    <Image 
                                        src={item.url} 
                                        alt={item.name}
                                        unoptimized
                                        fill 
                                        sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                                        className="object-cover" 
                                    />
                                ) : (
                                    <File className="h-12 w-12 text-muted-foreground" />
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                                    <p className="text-white text-xs text-center font-semibold break-all">{item.name}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {items.length === 0 && !isLoading && (
                    <div className="col-span-full text-center py-16">
                        <p className="text-muted-foreground">This folder is empty.</p>
                    </div>
                )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

    