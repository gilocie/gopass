
'use client';

import * as React from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from './ui/slider';
import { Save, X, ZoomIn, RotateCw } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';

interface ImageCropperProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImageUrl: string) => void;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function ImageCropper({ isOpen, onClose, imageSrc, onCropComplete }: ImageCropperProps) {
  const [crop, setCrop] = React.useState<Crop>();
  const [completedCrop, setCompletedCrop] = React.useState<Crop>();
  const [scale, setScale] = React.useState(1);
  const [rotate, setRotate] = React.useState(0);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const previewCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const aspect = 1;

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspect));
  }

  React.useEffect(() => {
    if (
      completedCrop?.width &&
      completedCrop?.height &&
      imgRef.current &&
      previewCanvasRef.current
    ) {
      canvasPreview(
        imgRef.current,
        previewCanvasRef.current,
        completedCrop,
        scale,
        rotate
      );
    }
  }, [completedCrop, scale, rotate]);

  const handleCrop = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) {
      throw new Error('Crop canvas does not exist');
    }
    const dataUrl = canvas.toDataURL('image/jpeg');
    onCropComplete(dataUrl);
  };
  
  const canvasPreview = async (
    image: HTMLImageElement,
    canvas: HTMLCanvasElement,
    crop: Crop,
    scale = 1,
    rotate = 0
  ) => {
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio;

    canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
    canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';

    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;

    const rotateRads = (rotate * Math.PI) / 180;
    const centerX = image.naturalWidth / 2;
    const centerY = image.naturalHeight / 2;

    ctx.save();
    ctx.translate(-cropX, -cropY);
    ctx.translate(centerX, centerY);
    ctx.rotate(rotateRads);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);
    ctx.drawImage(
      image,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight
    );

    ctx.restore();
  }


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-fit p-0 border-0 bg-transparent shadow-none" showCloseButton={false}>
         <DialogHeader className="sr-only">
            <DialogTitle>Crop Image</DialogTitle>
            <DialogDescription>Adjust the image below to get the perfect crop. Use the controls to zoom and rotate.</DialogDescription>
        </DialogHeader>
         <div className="relative flex items-start">
            <div className="grid gap-4 py-4 bg-card p-4 rounded-l-lg border-y border-l">
                <div className="max-h-[350px] overflow-y-auto">
                    <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={aspect}
                    >
                    <img
                        ref={imgRef}
                        alt="Crop me"
                        src={imageSrc}
                        style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
                        onLoad={onImageLoad}
                    />
                    </ReactCrop>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="scale-input" className="text-sm flex items-center gap-2 mb-1"><ZoomIn className="h-4 w-4" /> Zoom</label>
                        <Slider
                        id="scale-input"
                        defaultValue={[scale]}
                        min={0.1}
                        max={2}
                        step={0.01}
                        onValueChange={(value) => setScale(value[0])}
                        />
                    </div>
                    <div>
                        <label htmlFor="rotate-input" className="text-sm flex items-center gap-2 mb-1"><RotateCw className="h-4 w-4" /> Rotate</label>
                        <Slider
                        id="rotate-input"
                        defaultValue={[rotate]}
                        min={-180}
                        max={180}
                        step={1}
                        onValueChange={(value) => setRotate(value[0])}
                        />
                    </div>
                </div>
                 {!!completedCrop && (
                    <div className="hidden">
                        <canvas ref={previewCanvasRef} />
                    </div>
                )}
            </div>
             <TooltipProvider>
                <div className="flex flex-col gap-2 p-2 bg-card rounded-r-lg border-y border-r">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={handleCrop}><Save/></Button>
                        </TooltipTrigger>
                        <TooltipContent side="right"><p>Save Crop</p></TooltipContent>
                    </Tooltip>
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={onClose}><X/></Button>
                        </TooltipTrigger>
                        <TooltipContent side="right"><p>Cancel</p></TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>
         </div>
      </DialogContent>
    </Dialog>
  );
}
