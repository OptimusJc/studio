
'use client';

import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Library } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { AssetPickerDialog } from './AssetPickerDialog';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface ImageUploaderProps {
  field: 'productImages' | 'additionalImages';
  index?: number;
}

export function ImageUploader({ field, index }: ImageUploaderProps) {
  const { setValue, getValues, watch } = useFormContext();
  const { firebaseApp } = useFirebase();
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const imageUrl = index !== undefined ? watch(`${field}.${index}`) : watch(field)?.[0];
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl || null);
  
  useEffect(() => {
    setPreviewUrl(imageUrl || null);
  }, [imageUrl]);

  const updateFormValue = (url: string) => {
    if (field === 'productImages') {
      setValue(field, [url], { shouldValidate: true });
    } else {
      const currentImages = getValues(field) || [];
      if (index !== undefined) {
        currentImages[index] = url;
        setValue(field, currentImages, { shouldValidate: true });
      } else {
        setValue(field, [...currentImages, url], { shouldValidate: true });
      }
    }
  };

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
        description: 'Please select a JPG, PNG, GIF, or WebP image.',
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
          updateFormValue(downloadURL);
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
        setValue(field, newImages, { shouldValidate: true, shouldDirty: true });
    } else {
        setValue(field, [], { shouldValidate: true, shouldDirty: true });
    }
  };

  const handleAssetSelect = (url: string) => {
    updateFormValue(url);
    toast({
        title: 'Image Selected',
        description: 'Image from library has been linked.',
    });
  }

  const sizes = field === 'productImages'
    ? "(max-width: 1024px) 100vw, 66vw"
    : "(max-width: 640px) 50vw, 25vw";

  return (
    <Card className="border-dashed relative group">
      <CardContent className="p-2">
        {previewUrl ? (
          <div className="relative aspect-square">
            <Image 
                src={previewUrl} 
                alt="Product image preview" 
                fill 
                sizes={sizes}
                className="object-cover rounded-md" 
            />
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
          <div className="flex flex-col items-center justify-center text-center h-48">
             <Input 
                id={`file-input-${field}-${index ?? 'new'}`}
                type="file" 
                className="hidden" 
                onChange={handleFileChange} 
                accept={ALLOWED_FILE_TYPES.join(',')}
                disabled={isUploading}
             />
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              <Button 
                type="button" 
                variant="link" 
                className="p-0 h-auto"
                onClick={() => document.getElementById(`file-input-${field}-${index ?? 'new'}`)?.click()}
              >
                Click to upload
              </Button>
            </p>
             <div className="flex items-center gap-2 my-2">
                <div className="flex-1 border-t"></div>
                <span className="text-xs text-muted-foreground">OR</span>
                <div className="flex-1 border-t"></div>
            </div>
             <AssetPickerDialog onAssetSelect={handleAssetSelect}>
                <Button type="button" variant="outline" size="sm">
                    <Library className="mr-2 h-4 w-4" />
                    Browse Library
                </Button>
             </AssetPickerDialog>
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
