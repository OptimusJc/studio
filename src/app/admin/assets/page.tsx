
'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useStorage } from '@/firebase';
import { ref, listAll, getDownloadURL, deleteObject, StorageReference, ListResult } from 'firebase/storage';
import { AssetUploader } from './components/AssetUploader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Folder, File, Copy, Trash2, MoreVertical, X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CreateFolderDialog } from './components/CreateFolderDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface StorageItem {
  name: string;
  path: string;
  type: 'folder' | 'file';
  url?: string;
  ref: StorageReference;
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
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const fetchItems = useCallback(async () => {
    if (!storage) return;
    setIsLoading(true);
    setSelectedItems(new Set()); // Clear selection on path change

    const listRef = ref(storage, currentPath);
    try {
      const res: ListResult = await listAll(listRef);
      const folderItems: StorageItem[] = res.prefixes.map(folderRef => ({
          name: folderRef.name,
          path: folderRef.fullPath,
          type: 'folder',
          ref: folderRef,
      }));

      // Create an array of promises for getting download URLs
      const filePromises = res.items
        .filter(itemRef => itemRef.name !== '.gitkeep')
        .map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          return {
            name: itemRef.name,
            path: itemRef.fullPath,
            type: 'file',
            url: url,
            ref: itemRef,
          };
        });

      // Await all promises in parallel
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
    fetchItems();
  }, [fetchItems, refreshKey]);
  
  const handleSelectItem = (path: string) => {
    setSelectedItems(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(path)) {
            newSelection.delete(path);
        } else {
            newSelection.add(path);
        }
        return newSelection;
    });
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
        setSelectedItems(new Set(items.map(item => item.path)));
    } else {
        setSelectedItems(new Set());
    }
  }


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

  const deleteItemsInBackground = async (itemsToDelete: StorageItem[]) => {
    if (!storage || itemsToDelete.length === 0) return;

    let deletedCount = 0;
    let errorCount = 0;

    for (const item of itemsToDelete) {
        try {
            if (item.type === 'file') {
                await deleteObject(item.ref);
            } else if (item.type === 'folder') {
                const deleteFolderContents = async (path: string) => {
                    const listRef = ref(storage, path);
                    const res = await listAll(listRef);
                    await Promise.all(res.items.map(itemRef => deleteObject(itemRef)));
                    await Promise.all(res.prefixes.map(folderRef => deleteFolderContents(folderRef.fullPath)));
                };
                await deleteFolderContents(item.path);
            }
            deletedCount++;
        } catch (error) {
            errorCount++;
            console.error(`Error deleting item ${item.path}:`, error);
        }
    }

    if (deletedCount > 0) {
        toast({ title: "Deletion Successful", description: `${deletedCount} item(s) have been deleted.`});
    }
    if (errorCount > 0) {
        toast({ variant: "destructive", title: "Deletion Failed", description: `${errorCount} item(s) could not be deleted.` });
    }
  }

  const handleDeleteItem = (itemToDelete: StorageItem) => {
    // Optimistically remove the item from the UI
    setItems(prevItems => prevItems.filter(item => item.path !== itemToDelete.path));
    setSelectedItems(prev => {
        const newSelection = new Set(prev);
        newSelection.delete(itemToDelete.path);
        return newSelection;
    });

    // Perform the actual deletion in the background
    deleteItemsInBackground([itemToDelete]);
  }

  const handleDeleteSelected = () => {
    const itemsToDelete = items.filter(item => selectedItems.has(item.path));
    
    // Optimistically remove the items from the UI
    setItems(prevItems => prevItems.filter(item => !selectedItems.has(item.path)));
    setSelectedItems(new Set());
    
    // Perform the actual deletion in the background
    deleteItemsInBackground(itemsToDelete);
  }

  const breadcrumbs = currentPath.split('/').filter(p => p);
  
  const isAllSelected = items.length > 0 && selectedItems.size === items.length;
  const isIndeterminate = selectedItems.size > 0 && selectedItems.size < items.length;

  return (
    <div className="p-4 md:p-8 space-y-8">
      <PageHeader
        title="Asset Manager"
        description="Upload and manage your images and other files."
      >
        <CreateFolderDialog currentPath={currentPath} onFolderCreated={() => setRefreshKey(prev => prev + 1)} />
      </PageHeader>

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
            {selectedItems.size > 0 && (
                <div className="mb-4 flex items-center gap-4 p-2 rounded-lg border bg-secondary">
                    <p className="text-sm font-medium flex-grow">
                        {selectedItems.size} item(s) selected
                    </p>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Selected
                            </Button>
                        </AlertDialogTrigger>
                         <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete the {selectedItems.size} selected item(s). This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive hover:bg-destructive/90">
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedItems(new Set())}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
            <div className="flex items-center gap-2 mb-4">
                <Checkbox
                    id="select-all"
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium">Select All</label>
            </div>
          {isLoading ? <AssetGridSkeleton /> : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {items.map(item => (
                    <div key={item.path} className={cn("group relative rounded-lg", selectedItems.has(item.path) && "ring-2 ring-primary ring-offset-2")}>
                         <div className="absolute top-2 left-2 z-10">
                            <Checkbox
                                className="bg-background/50 hover:bg-background/80 border-slate-500"
                                checked={selectedItems.has(item.path)}
                                onCheckedChange={() => handleSelectItem(item.path)}
                            />
                        </div>
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
                                    <Image 
                                        src={item.url} 
                                        alt={item.name}
                                        unoptimized
                                        fill 
                                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16.6vw"
                                        className="object-cover" 
                                    />
                                ) : (
                                    <File className="h-16 w-16 text-muted-foreground" />
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                                    <p className="text-white text-xs text-center font-semibold break-all">{item.name}</p>
                                </div>
                            </div>
                        )}
                         <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <AlertDialog>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="secondary" size="icon" className="h-7 w-7">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {item.type === 'file' && (
                                            <DropdownMenuItem onSelect={() => copyUrl(item.url!, item.name)}>
                                                <Copy className="mr-2 h-4 w-4" />
                                                Copy URL
                                            </DropdownMenuItem>
                                        )}
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the {item.type} &quot;{item.name}&quot;
                                            {item.type === 'folder' && ' and all of its contents'}.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteItem(item)} className="bg-destructive hover:bg-destructive/90">
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
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

    