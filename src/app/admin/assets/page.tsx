
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useStorage } from '@/firebase';
import { ref, listAll, getDownloadURL, StorageReference, ListResult } from 'firebase/storage';
import { AssetUploader } from './components/AssetUploader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Folder, File, Copy } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface StorageItem {
  name: string;
  path: string;
  type: 'folder' | 'file';
  url?: string;
}

function AssetGridSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-lg" />
            ))}
        </div>
    )
}

export default function AssetsPage() {
  const storage = useStorage();
  const { toast } = useToast();
  const [items, setItems] = useState<StorageItem[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchItems = useCallback(async () => {
    if (!storage) return;
    setIsLoading(true);

    const listRef = ref(storage, currentPath);
    try {
      const res: ListResult = await listAll(listRef);
      const fetchedItems: StorageItem[] = [];

      // Add folders
      res.prefixes.forEach(folderRef => {
        fetchedItems.push({
          name: folderRef.name,
          path: folderRef.fullPath,
          type: 'folder',
        });
      });

      // Add files
      for (const itemRef of res.items) {
        const url = await getDownloadURL(itemRef);
        fetchedItems.push({
          name: itemRef.name,
          path: itemRef.fullPath,
          type: 'file',
          url: url,
        });
      }

      setItems(fetchedItems);
    } catch (error) {
      console.error("Error listing storage items:", error);
      toast({ variant: "destructive", title: "Could not load assets", description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  }, [storage, currentPath, toast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems, refreshKey]);

  const handleFolderClick = (path: string) => {
    setCurrentPath(path);
  };

  const handleBreadcrumbClick = (path: string) => {
    setCurrentPath(path);
  };

  const copyUrl = (url: string, name: string) => {
    navigator.clipboard.writeText(url).then(() => {
        toast({ title: "URL Copied!", description: `The URL for ${name} has been copied.` });
    }).catch(() => {
        toast({ variant: "destructive", title: "Failed to copy URL." });
    });
  }
  
  const handleUploadComplete = () => {
    toast({ title: "Uploads finished", description: "Your assets are now available." });
    setRefreshKey(prev => prev + 1); // Trigger a refresh
  }

  const breadcrumbs = currentPath.split('/').filter(p => p);

  return (
    <div className="p-4 md:p-8 space-y-8">
      <PageHeader
        title="Asset Manager"
        description="Upload and manage your images and other files."
      />

      <AssetUploader onUploadComplete={handleUploadComplete} />

      <Card>
        <CardHeader>
          <CardTitle>Asset Library</CardTitle>
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
        </CardHeader>
        <CardContent>
          {isLoading ? <AssetGridSkeleton /> : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {items.map(item => (
                    <div key={item.path} className="group relative">
                        {item.type === 'folder' ? (
                            <div 
                                className="aspect-square w-full bg-muted rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-muted-foreground/20"
                                onClick={() => handleFolderClick(item.path)}
                            >
                                <Folder className="h-16 w-16 text-primary" />
                                <span className="mt-2 text-sm font-medium text-center truncate w-full px-2">{item.name}</span>
                            </div>
                        ) : (
                            <div className="aspect-square w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden border">
                                {item.url ? (
                                    <Image src={item.url} alt={item.name} fill className="object-cover" />
                                ) : (
                                    <File className="h-16 w-16 text-muted-foreground" />
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                                    <p className="text-white text-xs text-center font-semibold break-all">{item.name}</p>
                                    <Button size="icon" variant="secondary" className="mt-2 h-8 w-8" onClick={() => copyUrl(item.url!, item.name)}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
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
        </CardContent>
      </Card>
    </div>
  );
}
