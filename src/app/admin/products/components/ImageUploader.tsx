'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

interface ImageUploaderProps {
  field: 'productImages' | 'additionalImages';
  index?: number;
}

export function ImageUploader({ field, index }: ImageUploaderProps) {
  const { setValue, getValues } = useFormContext();
  const { firebaseApp } = useFirebase();
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    index !== undefined ? getValues(`${field}.${index}`) : getValues(field)?.[0] || null
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Image size should not exceed 2MB.',
      });
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please select a JPG, PNG, or GIF image.',
      });
      return;
    }

    handleUpload(file);
  };

  const handleUpload = (file: File) => {
    if (!firebaseApp) {
      toast({
        variant: 'destructive',
        title: 'Firebase Not Initialized',
        description: 'Cannot upload image.',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    const storage = getStorage(firebaseApp);
    const storageRef = ref(storage, `product-images/${Date.now()}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        setIsUploading(false);
        setUploadProgress(null);
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: error.message,
        });
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setIsUploading(false);
          setUploadProgress(null);
          setPreviewUrl(downloadURL);
          
          if (field === 'productImages') {
             setValue(field, [downloadURL], { shouldValidate: true });
          } else {
             const currentImages = getValues(field) || [];
             if (index !== undefined) {
                currentImages[index] = downloadURL;
                setValue(field, currentImages, { shouldValidate: true });
             } else {
                setValue(field, [...currentImages, downloadURL], { shouldValidate: true });
             }
          }

          toast({
            title: 'Upload Successful',
            description: 'Image has been uploaded and linked.',
          });
        });
      }
    );
  };
  
  const handleRemoveImage = () => {
    if (index !== undefined) {
        const currentImages: string[] = getValues(field) || [];
        const newImages = currentImages.filter((_, i) => i !== index);
        setValue(field, newImages, { shouldValidate: true });
    } else {
        setValue(field, [], { shouldValidate: true });
    }
    setPreviewUrl(null);
  };


  return (
    <Card className="border-dashed relative group">
      <CardContent className="p-2">
        {previewUrl ? (
          <div className="relative aspect-square">
            <Image src={previewUrl} alt="Product image preview" fill className="object-cover rounded-md" />
             <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleRemoveImage}
             >
                <X className="h-4 w-4" />
             </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center h-48 cursor-pointer" onClick={() => document.getElementById(`file-input-${field}-${index ?? 'new'}`)?.click()}>
             <Input 
                id={`file-input-${field}-${index ?? 'new'}`}
                type="file" 
                className="hidden" 
                onChange={handleFileChange} 
                accept={ALLOWED_FILE_TYPES.join(',')}
                disabled={isUploading}
             />
            <Upload className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              <span className="font-semibold text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 2MB</p>
             {isUploading && uploadProgress !== null && (
                <div className="w-full px-4 absolute bottom-4">
                    <Progress value={uploadProgress} className="w-full h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{Math.round(uploadProgress)}%</p>
                </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
