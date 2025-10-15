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
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Upload } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { ImageSelectionDialog } from '../../products/components/ImageSelectionDialog';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required.'),
  description: z.string().optional(),
  imageUrl: z.string().min(1, 'Category image is required.'),
});

type CategoryFormValues = z.infer<typeof categorySchema>;


function ImageUploadCard({ 
  imageUrl,
  onClick 
}: { 
  imageUrl?: string;
  onClick: () => void;
}) {
  return (
    <Card className="border-dashed cursor-pointer hover:border-primary transition-colors" onClick={onClick}>
      <CardContent className="p-6">
        {imageUrl ? (
           <div className="relative aspect-video">
            <Image src={imageUrl} alt="Selected category image" fill className="object-cover rounded-md" />
           </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center h-32">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-semibold text-primary">Select an image</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


export function AddCategoryDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      imageUrl: '',
    },
  });

  const onSubmit = async (data: CategoryFormValues) => {
    if (!firestore) return;

    const categoriesCollection = collection(firestore, 'categories');
    
    await addDocumentNonBlocking(categoriesCollection, data);

    toast({
      title: 'Category Added',
      description: `The category "${data.name}" has been successfully added.`,
    });
    
    setIsOpen(false);
    form.reset();
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
    }
    setIsOpen(open);
  }
  
  const handleImageSelected = (imageUrl: string) => {
    form.setValue('imageUrl', imageUrl, { shouldValidate: true });
    setIsImageDialogOpen(false);
  };

  const imageUrl = form.watch('imageUrl');

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button><PlusCircle /> Add Category</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>
            Create a new category for your products.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Wallpapers" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A short description of the category." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="imageUrl"
              render={() => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                     <ImageUploadCard imageUrl={imageUrl} onClick={() => setIsImageDialogOpen(true)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Save Category</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
     <ImageSelectionDialog
        isOpen={isImageDialogOpen}
        onOpenChange={setIsImageDialogOpen}
        onSelectImage={handleImageSelected}
      />
    </>
  );
}
