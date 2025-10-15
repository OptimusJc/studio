'use client';

import { useForm } from 'react-hook-form';
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
import { useRouter } from 'next/navigation';
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const productSchema = z.object({
  productTitle: z.string().min(1, 'Product title is required.'),
  productDescription: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be a positive number.'),
  specifications: z.string().optional(),
  material: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  brand: z.string().optional(),
  pattern: z.string().optional(),
  texture: z.string().optional(),
  category: z.string().min(1, 'Category is required.'),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
    attributes: Record<string, string[]>;
    categories: { id: string, name: string }[];
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

export function ProductForm({ attributes, categories }: ProductFormProps) {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
        price: 0,
    }
  });

  const onSubmit = async (data: ProductFormValues) => {
    if (!firestore) {
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "Firestore is not available. Please try again later.",
        });
        return;
    }
    
    if (!data.category) {
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "Please select a product category.",
        });
        return;
    }

    try {
      const categoryCollectionName = data.category.toLowerCase().replace(/\s+/g, '-');
      const productsCollection = collection(firestore, categoryCollectionName);
      
      const newProduct = {
        productTitle: data.productTitle,
        productDescription: data.productDescription,
        price: data.price,
        productImages: ['https://picsum.photos/seed/new-product/600/600'], // Placeholder
        additionalImages: ['https://picsum.photos/seed/new-product-add/600/600'], // Placeholder
        specifications: data.specifications,
        attributes: {
            color: data.color,
            material: data.material,
            size: data.size,
            brand: data.brand,
            pattern: data.pattern,
            texture: data.texture,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await addDocumentNonBlocking(productsCollection, newProduct);

      toast({
        title: "Product Saved!",
        description: `${data.productTitle} has been added to the catalog.`,
      });

      router.push('/admin/products');

    } catch (error) {
        console.error("Error adding document: ", error);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem saving the product.",
        });
    }
  };
  
  const handleDiscard = () => {
    router.push('/admin/products');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardContent className="p-6 space-y-6">
                <FormField
                  control={form.control}
                  name="productTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Elegant Floral Wallpaper" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <FormField
                  control={form.control}
                  name="specifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specifications</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Roll: 0.53m x 10m"
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
                <CardTitle>Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Attributes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
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
                           <SelectItem value="royal-walls">Royal Walls</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="pattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pattern</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select pattern" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           <SelectItem value="floral">Floral</SelectItem>
                           <SelectItem value="geometric">Geometric</SelectItem>
                           <SelectItem value="striped">Striped</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="texture"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texture</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select texture" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           <SelectItem value="matte">Matte</SelectItem>
                           <SelectItem value="glossy">Glossy</SelectItem>
                           <SelectItem value="fabric">Fabric</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
             <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleDiscard}>Discard</Button>
                <Button type="submit">Save Product</Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
