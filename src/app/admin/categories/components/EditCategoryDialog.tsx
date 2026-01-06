
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
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
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
  name: z
    .string()
    .min(1, 'Category name is required.')
    .regex(/^[a-zA-Z0-9- ]+$/, 'Name can only contain letters, numbers, spaces, and hyphens.'),
  description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export function EditCategoryDialog({ category }: EditCategoryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category.name,
      description: category.description,
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
        });
    }
    setIsOpen(open);
  }

  return (
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

            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
