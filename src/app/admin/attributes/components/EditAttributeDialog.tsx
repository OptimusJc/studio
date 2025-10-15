'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

type Attribute = {
  id: string;
  name: string;
  values: string[];
};

interface EditAttributeDialogProps {
  attribute: Attribute;
}

const attributeSchema = z.object({
  name: z.string().min(1, 'Attribute name is required.'),
  values: z.array(z.object({ value: z.string().min(1, 'Value cannot be empty.') })).min(1, 'At least one value is required.'),
});

type AttributeFormValues = z.infer<typeof attributeSchema>;

export function EditAttributeDialog({ attribute }: EditAttributeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<AttributeFormValues>({
    resolver: zodResolver(attributeSchema),
    defaultValues: {
      name: attribute.name,
      values: attribute.values.map(v => ({ value: v })),
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'values',
  });

  const onSubmit = async (data: AttributeFormValues) => {
    if (!firestore) return;

    const docRef = doc(firestore, 'attributes', attribute.id);
    const updatedAttribute = {
      name: data.name,
      values: data.values.map(v => v.value),
    };
    
    setDocumentNonBlocking(docRef, updatedAttribute, { merge: true });

    toast({
      title: 'Attribute Updated',
      description: `The attribute "${data.name}" has been successfully updated.`,
    });
    
    setIsOpen(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (open) {
       form.reset({
        name: attribute.name,
        values: attribute.values.map(v => ({ value: v })),
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
          <DialogTitle>Edit Attribute</DialogTitle>
          <DialogDescription>
            Update the attribute name and its values.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attribute Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Color" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Values</FormLabel>
              <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`values.${index}.value`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input placeholder={`Value ${index + 1}`} {...field} />
                          </FormControl>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => remove(index)}
                            disabled={fields.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ value: '' })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Value
              </Button>
            </div>

            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
