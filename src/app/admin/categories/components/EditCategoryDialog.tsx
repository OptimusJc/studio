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
import { Upload } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { ImageSelectionDialog } from '../../products/components/ImageSelectionDialog';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

type Category = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
};

interface EditCategoryDialogProps {
    category: Category
}

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


export function EditCategoryDialog({ category }: EditCategoryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl,
    },
  });

  const onSubmit = async (data: CategoryFormValues) => {
    if (!firestore) return;

    const docRef = doc(firestore, 'categories', category.id);
    
    setDocumentNonBlocking(docRef, data, { merge: true });

    toast({
      title: 'Category Updated',
      description: `The category "${data.name}" has been successfully updated.`,
    });
    
    setIsOpen(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (open) {
        form.reset({
            name: category.name,
            description: category.description,
            imageUrl: category.imageUrl,
        });
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
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          Edit
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Update the details of the category.
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
              <Button type="submit">Save Changes</Button>
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
