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
import { useFirestore, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types';
import { useEffect, useState } from 'react';
import { ImageSelectionDialog } from './ImageSelectionDialog';
import Image from 'next/image';

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
  productImages: z.array(z.string()).min(1, "At least one primary image is required."),
  additionalImages: z.array(z.string()).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
    initialData?: Product | null;
    attributes: Record<string, string[]>;
    categories: { id: string, name: string }[];
}

function ImageUploadCard({ 
  title,
  description,
  imageUrl,
  onClick 
}: { 
  title: string; 
  description: string;
  imageUrl?: string;
  onClick: () => void;
}) {
  return (
    <Card className="border-dashed cursor-pointer hover:border-primary transition-colors" onClick={onClick}>
      <CardContent className="p-6">
        {imageUrl ? (
           <div className="relative aspect-square">
            <Image src={imageUrl} alt={title} fill className="object-cover rounded-md" />
           </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center h-48">
            <Upload className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              <span className="font-semibold text-primary">Upload a file</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ProductForm({ initialData, attributes, categories }: ProductFormProps) {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeImageField, setActiveImageField] = useState<'productImages' | 'additionalImages' | null>(null);

  const isEditMode = !!initialData;

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
        productTitle: '',
        productDescription: '',
        price: 0,
        specifications: '',
        material: '',
        color: '',
        size: '',
        brand: '',
        pattern: '',
        texture: '',
        category: '',
        productImages: [],
        additionalImages: [],
    }
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        productTitle: initialData.name,
        productDescription: (initialData as any).productDescription || '',
        price: initialData.price,
        specifications: (initialData as any).specifications || '',
        category: initialData.category,
        color: initialData.attributes.color as string || '',
        material: initialData.attributes.material as string || '',
        size: initialData.attributes.size as string || '',
        brand: initialData.attributes.brand as string || '',
        pattern: initialData.attributes.pattern as string || '',
        texture: initialData.attributes.texture as string || '',
        productImages: initialData.productImages || [],
        additionalImages: initialData.additionalImages || [],
      });
    }
  }, [initialData, form]);

  const handleImageSelectClick = (field: 'productImages' | 'additionalImages') => {
    setActiveImageField(field);
    setIsDialogOpen(true);
  };

  const handleImageSelected = (imageUrl: string) => {
    if (activeImageField) {
      const currentImages = form.getValues(activeImageField) || [];
      if (activeImageField === 'productImages') {
         form.setValue(activeImageField, [imageUrl], { shouldValidate: true });
      } else {
         form.setValue(activeImageField, [...currentImages, imageUrl], { shouldValidate: true });
      }
    }
    setIsDialogOpen(false);
    setActiveImageField(null);
  };

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
      
      const productData = {
        productTitle: data.productTitle,
        productDescription: data.productDescription,
        price: data.price,
        productImages: data.productImages,
        additionalImages: data.additionalImages,
        specifications: data.specifications,
        attributes: {
            color: data.color,
            material: data.material,
            size: data.size,
            brand: data.brand,
            pattern: data.pattern,
            texture: data.texture,
        },
        createdAt: initialData ? (initialData as any).createdAt : new Date(),
        updatedAt: new Date(),
      };
      
      if(isEditMode && initialData) {
        const docRef = doc(firestore, categoryCollectionName, initialData.id);
        await setDocumentNonBlocking(docRef, productData, { merge: true });
        toast({
            title: "Product Updated!",
            description: `${data.productTitle} has been updated.`,
        });
      } else {
        const productsCollection = collection(firestore, categoryCollectionName);
        await addDocumentNonBlocking(productsCollection, productData);
        toast({
            title: "Product Saved!",
            description: `${data.productTitle} has been added to the catalog.`,
        });
      }


      router.push('/admin/products');
      router.refresh();

    } catch (error) {
        console.error("Error saving document: ", error);
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

  const primaryImage = form.watch('productImages')?.[0];
  const additionalImages = form.watch('additionalImages') || [];


  return (
    <>
      <ImageSelectionDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSelectImage={handleImageSelected}
      />
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
                      <FormMessage>{form.formState.errors.productImages?.message}</FormMessage>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6">
                      <div>
                          <FormLabel>Primary Image</FormLabel>
                           <ImageUploadCard 
                              title="Primary Image" 
                              description="PNG, JPG, GIF up to 10MB"
                              imageUrl={primaryImage}
                              onClick={() => handleImageSelectClick('productImages')}
                           />
                      </div>
                      <div>
                          <FormLabel>Additional Images</FormLabel>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {additionalImages.map((img, index) => (
                                <div key={index} className="relative aspect-square">
                                    <Image src={img} alt={`Additional image ${index + 1}`} fill className="object-cover rounded-md" />
                                </div>
                            ))}
                             <ImageUploadCard 
                                title="Additional Images" 
                                description="Add more images"
                                onClick={() => handleImageSelectClick('additionalImages')}
                              />
                          </div>
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                        <Select onValueChange={field.onChange} value={field.value}>
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
                  <Button type="submit">{isEditMode ? 'Save Changes' : 'Save Product'}</Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </>
  );
}
