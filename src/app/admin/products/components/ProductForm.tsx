'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Rocket, Trash2, Save, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFirestore, addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Product, Attribute } from '@/types';
import { useEffect, useState, useMemo } from 'react';
import { ImageSelectionDialog } from './ImageSelectionDialog';
import Image from 'next/image';
import { manageProductStatus } from '@/ai/flows/manage-product-status-flow';
import { Badge } from '@/components/ui/badge';

const productSchema = z.object({
  productTitle: z.string().min(1, 'Product title is required.'),
  productCode: z.string().min(1, 'Product code is required.'),
  productDescription: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be a positive number.'),
  specifications: z.string().optional(),
  attributes: z.record(z.string()).optional(),
  category: z.string().min(1, 'Category is required.'),
  productImages: z.array(z.string()).min(1, "At least one primary image is required."),
  additionalImages: z.array(z.string()).optional(),
  db: z.enum(['retailers', 'buyers']),
  status: z.enum(['Published', 'Draft']),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
    initialData?: Product | null;
    allAttributes: Attribute[];
    categories: { id: string, name: string }[];
    initialDb: 'retailers' | 'buyers';
    initialCategory: string;
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

export function ProductForm({ initialData, allAttributes, categories, initialDb, initialCategory }: ProductFormProps) {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeImageField, setActiveImageField] = useState<'productImages' | 'additionalImages' | null>(null);
  
  const isEditMode = !!initialData;
  const currentProductId = initialData?.id || null;
  const currentStatus = initialData?.status || 'Draft';
  
  const defaultFormValues = useMemo(() => ({
    productTitle: '',
    productCode: '',
    productDescription: '',
    price: 0,
    specifications: '',
    attributes: {},
    category: initialCategory || '',
    productImages: [],
    additionalImages: [],
    db: initialDb,
    status: 'Draft' as const,
  }), [initialCategory, initialDb]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: defaultFormValues
  });
  
  const selectedCategory = form.watch('category');
  
  const relevantAttributes = useMemo(() => {
    if (!selectedCategory) return [];
    const categoryDetails = categories.find(c => c.name.toLowerCase().replace(/\s+/g, '-') === selectedCategory);
    if (!categoryDetails) return [];
    return allAttributes.filter(attr => attr.category === categoryDetails.name);
  }, [selectedCategory, allAttributes, categories]);


  useEffect(() => {
    if (initialData) {
      form.reset({
        productTitle: initialData.name,
        productCode: initialData.productCode || '',
        productDescription: initialData.productDescription || '',
        price: initialData.price,
        specifications: initialData.specifications || '',
        category: initialData.category.toLowerCase().replace(/\s+/g, '-'),
        attributes: initialData.attributes || {},
        productImages: initialData.productImages || [],
        additionalImages: initialData.additionalImages || [],
        db: initialData.db,
        status: initialData.status || 'Draft',
      });
    } else {
        form.reset(defaultFormValues);
    }
  }, [initialData, form, defaultFormValues]);

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

  const getProductDataFromForm = (data: ProductFormValues) => {
    return {
      productTitle: data.productTitle,
      productCode: data.productCode,
      productDescription: data.productDescription,
      price: data.price,
      productImages: data.productImages,
      additionalImages: data.additionalImages,
      specifications: data.specifications,
      attributes: data.attributes,
      status: data.status,
      category: data.category,
      db: data.db,
      createdAt: (isEditMode && initialData) ? (initialData as any).createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const handleSaveDraft = async (data: ProductFormValues) => {
    if (!firestore) return;
    const productData = getProductDataFromForm(data);
    
    if (currentProductId) {
      const docRef = doc(firestore, 'drafts', currentProductId);
      await setDocumentNonBlocking(docRef, productData, { merge: true });
      toast({
          title: "Draft Updated!",
          description: `${data.productTitle} has been updated.`,
      });
    } else {
      const draftsCollection = collection(firestore, 'drafts');
      const newDocRef = await addDocumentNonBlocking(draftsCollection, { ...productData, status: 'Draft'});
      toast({
          title: "Draft Saved!",
          description: `${data.productTitle} has been saved.`,
      });
      if (newDocRef) {
          const newPath = `/admin/products/edit/${newDocRef.id}?db=${data.db}&category=${data.category}`;
          router.replace(newPath, { scroll: false });
      }
    }
  };

  const handlePublish = async (data: ProductFormValues) => {
    if (!currentProductId) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must save a draft before publishing.' });
      return;
    }
    try {
      await manageProductStatus({
        action: 'publish',
        productId: currentProductId,
      });
      toast({ title: 'Product Published!', description: `${data.productTitle} is now live.` });
      router.push(`/admin/products?db=${data.db}&category=${data.category}`);
      router.refresh();
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Publishing Failed', description: (e as Error).message });
    }
  };

  const handleUnpublish = async (data: ProductFormValues) => {
    if (!currentProductId) return;
    try {
      await manageProductStatus({
        action: 'unpublish',
        productId: currentProductId,
        db: data.db,
        category: data.category,
      });
      toast({ title: 'Product Unpublished', description: `${data.productTitle} has been moved to drafts.` });
      router.push(`/admin/products/edit/${currentProductId}?db=${data.db}&category=${data.category}`);
      router.refresh();

    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Unpublishing Failed', description: (e as Error).message });
    }
  };
  
  const handleDiscard = () => {
    router.back();
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
        <form className="space-y-8">
          <div className="flex justify-end gap-2 sticky top-20 z-10 py-4 bg-background/80 backdrop-blur-sm">
              <Button type="button" variant="outline" onClick={handleDiscard}>Discard</Button>
              <Button type="button" variant="secondary" onClick={form.handleSubmit(handleSaveDraft)}>
                <Save className="mr-2 h-4 w-4" /> Save Draft
              </Button>
              {isEditMode && currentStatus === 'Published' && (
                <Button type="button" variant="destructive" onClick={form.handleSubmit(handleUnpublish)}>
                  <XCircle className="mr-2 h-4 w-4" /> Unpublish
                </Button>
              )}
               {isEditMode && currentStatus === 'Draft' && (
                <Button type="button" className="bg-green-600 hover:bg-green-700 text-white" onClick={form.handleSubmit(handlePublish)}>
                  <Rocket className="mr-2 h-4 w-4" /> Publish
                </Button>
              )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardContent className="p-6 space-y-6">
                   <FormField
                    control={form.control}
                    name="db"
                    render={({ field }) => (
                      <FormItem className="hidden">
                        <FormLabel>Database</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a database" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="retailers">Retailers</SelectItem>
                            <SelectItem value="buyers">Buyers</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                    name="productCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. WLP-FLR-001" {...field} />
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
                   <div className="space-y-2">
                        <FormLabel>Status</FormLabel>
                        <Badge variant={currentStatus === 'Published' ? 'secondary' : 'outline'}>
                            {currentStatus}
                        </Badge>
                   </div>
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
                              <SelectItem key={category.id} value={category.name.toLowerCase().replace(/\s+/g, '-')}>{category.name}</SelectItem>
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
                    {relevantAttributes.map(attr => (
                         <FormField
                            key={attr.id}
                            control={form.control}
                            name={`attributes.${attr.name.toLowerCase()}`}
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{attr.name}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder={`Select ${attr.name.toLowerCase()}`} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {attr.values.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    ))}
                    {relevantAttributes.length === 0 && selectedCategory && (
                        <p className="text-sm text-muted-foreground">No attributes defined for this category.</p>
                    )}
                     {relevantAttributes.length === 0 && !selectedCategory && (
                        <p className="text-sm text-muted-foreground">Select a category to see its attributes.</p>
                    )}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </>
  );
}
