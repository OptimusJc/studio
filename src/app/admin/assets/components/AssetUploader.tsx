
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { UploadCloud, File, X, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface UploadableFile {
  file: File;
  path: string;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  url?: string;
}

export function AssetUploader({ onUploadComplete }: { onUploadComplete: () => void }) {
  const { firebaseApp } = useFirebase();
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadableFile[]>([]);
  const storage = firebaseApp ? getStorage(firebaseApp) : null;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newUploads: UploadableFile[] = acceptedFiles.map(file => ({
      file,
      // The `path` property is only available when dropping folders
      path: (file as any).path || file.name,
      id: `${file.name}-${file.size}-${file.lastModified}`,
      status: 'pending',
      progress: 0,
    }));

    setFiles(prevFiles => {
      // Prevent duplicates
      const existingIds = new Set(prevFiles.map(f => f.id));
      const uniqueNewUploads = newUploads.filter(f => !existingIds.has(f.id));
      return [...prevFiles, ...uniqueNewUploads];
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true, // We'll use our own button
  });
  
  const handleUpload = () => {
    if (!storage) {
        toast({
            variant: "destructive",
            title: "Storage service not available"
        });
        return;
    }

    const filesToUpload = files.filter(f => f.status === 'pending');
    if (filesToUpload.length === 0) {
        toast({ title: "No new files to upload." });
        return;
    }

    filesToUpload.forEach(uploadableFile => {
        const filePath = uploadableFile.path.startsWith('/') ? uploadableFile.path.substring(1) : uploadableFile.path;
        const storageRef = ref(storage, filePath);

        setFiles(prev => prev.map(f => f.id === uploadableFile.id ? { ...f, status: 'uploading' } : f));
        
        const uploadTask = uploadBytesResumable(storageRef, uploadableFile.file);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setFiles(prev => prev.map(f => f.id === uploadableFile.id ? { ...f, progress } : f));
            },
            (error) => {
                setFiles(prev => prev.map(f => f.id === uploadableFile.id ? { ...f, status: 'error', error: error.message } : f));
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    setFiles(prev => prev.map(f => f.id === uploadableFile.id ? { ...f, status: 'success', progress: 100, url: downloadURL } : f));
                    if (files.every(f => f.status === 'success' || f.status === 'error')) {
                        onUploadComplete();
                    }
                });
            }
        );
    });
  };

  const removeFile = (id: string) => {
    setFiles(prevFiles => prevFiles.filter(f => f.id !== id));
  };
  
  const openFileDialog = () => {
    const input = document.getElementById('file-input');
    if (input) {
      input.click();
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragActive ? 'border-primary bg-primary/10' : 'border-border'
          }`}
        >
          {/* Hidden input for folder selection */}
          <input {...getInputProps()} id="file-input" style={{ display: 'none' }} webkitdirectory="" mozdirectory="" />
          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            Drag and drop folders here, or{' '}
            <Button variant="link" className="p-0 h-auto" onClick={openFileDialog}>
              browse to upload
            </Button>
            .
          </p>
          <p className="text-xs text-muted-foreground mt-1">Your local folder structure will be preserved.</p>
        </div>

        {files.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Upload Queue</h3>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {files.map(uploadableFile => (
                    <div key={uploadableFile.id} className="flex items-center gap-4 p-2 border rounded-md">
                        <File className="h-6 w-6 text-muted-foreground" />
                        <div className="flex-1">
                            <p className="text-sm font-medium truncate">{uploadableFile.path}</p>
                             {uploadableFile.status === 'uploading' && <Progress value={uploadableFile.progress} className="h-2 mt-1" />}
                             {uploadableFile.status === 'error' && <p className="text-xs text-destructive">{uploadableFile.error}</p>}
                        </div>
                        {uploadableFile.status === 'success' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(uploadableFile.id)} disabled={uploadableFile.status === 'uploading'}>
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>
             <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setFiles([])} disabled={files.every(f => f.status === 'uploading')}>Clear Queue</Button>
                <Button onClick={handleUpload} disabled={files.every(f => f.status !== 'pending')}>
                    Upload {files.filter(f => f.status === 'pending').length} Files
                </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
