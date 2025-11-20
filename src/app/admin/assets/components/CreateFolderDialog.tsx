'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FolderPlus } from 'lucide-react';
import { useStorage } from '@/firebase';
import { ref, uploadBytes } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';

const folderSchema = z.object({
  name: z.string().min(1, 'Folder name is required.').regex(/^[a-zA-Z0-9_-]+$/, 'Folder name can only contain letters, numbers, underscores, and hyphens.'),
});

type FolderFormValues = z.infer<typeof folderSchema>;

interface CreateFolderDialogProps {
    currentPath: string;
    onFolderCreated: () => void;
}

export function CreateFolderDialog({ currentPath, onFolderCreated }: CreateFolderDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const storage = useStorage();
  const { toast } = useToast();

  const form = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = async (data: FolderFormValues) => {
    if (!storage) {
        toast({ variant: 'destructive', title: 'Storage not available' });
        return;
    }

    const folderPath = currentPath ? `${currentPath}/${data.name}` : data.name;
    const placeholderPath = `${folderPath}/.gitkeep`;
    const placeholderRef = ref(storage, placeholderPath);
    
    try {
        // Create an empty file (blob) to act as a placeholder
        const placeholderBlob = new Blob([''], { type: 'text/plain' });
        await uploadBytes(placeholderRef, placeholderBlob);
        
        toast({
            title: 'Folder Created',
            description: `The folder "${data.name}" has been successfully created.`,
        });

        onFolderCreated();
        setIsOpen(false);
        form.reset();
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Failed to Create Folder',
            description: (error as Error).message,
        });
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
            <FolderPlus className="mr-2 h-4 w-4" />
            Create Folder
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>
            Enter a name for your new folder. The folder will be created in the current directory: /{currentPath}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. wallpapers" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Create Folder</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
