'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';

const productSchema = z.object({
  productTitle: z.string().min(1, 'Product title is required.'),
  productCode: z.string().min(1, 'Product code is required.'),
  productDescription: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be a positive number.'),
  specifications: z.string().optional(),
  material: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  brand: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
    attributes: Record<string, string[]>;
}

function ImageUploadCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center text-center h-48">
          <Upload className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            <span className="font-semibold text-primary">Upload a file</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductForm({ attributes }: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
        price: 0.00,
    }
  });

  const onSubmit = (data: ProductFormValues) => {
    console.log(data);
    // Handle form submission
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="productTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Premium Wireless Headphones" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="productCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. ACME-HP-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="productDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the product's features, benefits, and specifications."
                          {...field}
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                                <Input type="number" placeholder="0.00" className="pl-7" {...field} />
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <FormField
                  control={form.control}
                  name="specifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specifications</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Bluetooth: 5.2, Battery Life: 40 hours, Weight: 250g"
                          {...field}
                           rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Product Images</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                    <div>
                        <FormLabel>Primary Image</FormLabel>
                        <ImageUploadCard title="Primary Image" description="PNG, JPG, GIF up to 10MB" />
                    </div>
                    <div>
                        <FormLabel>Additional Images</FormLabel>
                        <ImageUploadCard title="Additional Images" description="PNG, JPG, GIF up to 10MB" />
                    </div>
                </CardContent>
            </Card>
          </div>
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Attributes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <FormField
                  control={form.control}
                  name="material"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {attributes.material?.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select color" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {attributes.color?.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {attributes.size?.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           <SelectItem value="acme">Acme</SelectItem>
                           <SelectItem value="apex">Apex</SelectItem>
                           <SelectItem value="aurora">Aurora</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
             <div className="flex justify-end gap-2">
                <Button type="button" variant="outline">Discard</Button>
                <Button type="submit">Save Product</Button>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
