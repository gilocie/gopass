
'use client';

import * as React from 'react';
import { UploadCloud, X } from 'lucide-react';
import { Button } from './button';
import Image from 'next/image';

const MAX_WIDTH = 1200;
const MAX_SIZE_MB = 1;

export function Banner({ initialImage, onImageChange }: { initialImage?: string | null, onImageChange: (dataUrl: string | null) => void }) {
  const [preview, setPreview] = React.useState<string | null>(initialImage || null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setPreview(initialImage || null);
  }, [initialImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          let { width, height } = img;
          
          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);

          // Check size and adjust quality if needed
          let quality = 0.9;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);

          while (dataUrl.length > MAX_SIZE_MB * 1024 * 1024 && quality > 0.1) {
              quality -= 0.1;
              dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          
          if (dataUrl.length > MAX_SIZE_MB * 1024 * 1024) {
             alert(`Image is still too large after compression. Please choose a smaller file (under ${MAX_SIZE_MB * 2}MB).`);
             return;
          }

          setPreview(dataUrl);
          onImageChange(dataUrl);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
        setPreview(null);
        onImageChange(null);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full aspect-[16/5] rounded-lg border-2 border-dashed border-border flex items-center justify-center relative bg-secondary/50 overflow-hidden">
      {preview ? (
        <>
          <Image src={preview} alt="Event Banner" layout="fill" objectFit="cover" crossOrigin="anonymous" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full z-10"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <div className="text-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />
          <button
            onClick={handleUploadClick}
            className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors"
          >
            <UploadCloud className="h-10 w-10 mb-2" />
            <span className="font-semibold">Click to upload a banner</span>
            <span className="text-xs">PNG, JPG, GIF (will be compressed)</span>
          </button>
        </div>
      )}
    </div>
  );
}

    