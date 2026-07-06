import React, { useState, useRef, useId } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { getSettings } from '../lib/store';

interface ImageUploaderProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  aspectRatio?: 'square' | 'rect';
  description?: string;
  id?: string;
  storageFolder?: string;
}

export function ImageUploader({ 
  label, 
  value, 
  onChange, 
  aspectRatio = 'square', 
  description, 
  id,
  storageFolder = 'uploads'
}: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const dataURLToBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const uploadToStorage = async (dataUrl: string, originalFileName: string) => {
    try {
      setIsUploading(true);
      setUploadError('');
      setUploadProgress(15);

      // Fetch dynamic Cloudinary settings
      const settings = await getSettings();
      const cloudName = settings.cloudinaryCloudName || '';
      const uploadPreset = settings.cloudinaryUploadPreset || '';

      // If Cloudinary settings are missing or default placeholders, immediately use Base64 as other free storage
      if (!cloudName || !uploadPreset || cloudName === 'dkafy9b8g' || uploadPreset === 'unsigned_preset') {
        console.log('No custom Cloudinary config. Using optimized local storage fallback.');
        onChange(dataUrl);
        setIsUploading(false);
        setUploadProgress(0);
        return;
      }

      const blob = dataURLToBlob(dataUrl);
      const formData = new FormData();
      formData.append('file', blob, originalFileName);
      formData.append('upload_preset', uploadPreset);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, true);
      xhr.timeout = 4000; // 4 seconds timeout for reliable fallback

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.min(Math.round((e.loaded / e.total) * 100), 99);
          setUploadProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            const downloadURL = response.secure_url || response.url;
            onChange(downloadURL);
            setIsUploading(false);
            setUploadProgress(0);
          } catch (err) {
            console.warn('JSON parsing failed. Using Base64 fallback.', err);
            onChange(dataUrl);
            setIsUploading(false);
            setUploadProgress(0);
          }
        } else {
          console.warn('Cloudinary upload failed (status ' + xhr.status + '). Falling back to optimized Base64.');
          onChange(dataUrl);
          setIsUploading(false);
          setUploadProgress(0);
        }
      };

      xhr.onerror = () => {
        console.warn('Cloudinary connection error. Falling back to optimized Base64.');
        onChange(dataUrl);
        setIsUploading(false);
        setUploadProgress(0);
      };

      xhr.ontimeout = () => {
        console.warn('Cloudinary upload timed out. Falling back to optimized Base64.');
        onChange(dataUrl);
        setIsUploading(false);
        setUploadProgress(0);
      };

      xhr.send(formData);
    } catch (err: any) {
      console.warn('Error during storage upload prep. Falling back to optimized Base64.', err);
      onChange(dataUrl);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const compressAndResizeImage = (file: File) => {
    setIsUploading(true);
    setUploadError('');
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onerror = () => {
      setUploadError('Failed to read file.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        setUploadError('Failed to load image.');
        setIsUploading(false);
      };
      img.src = event.target?.result as string;
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const labelLower = label.toLowerCase();
          const isFavicon = labelLower.includes('favicon');
          const isLogo = labelLower.includes('logo');

          // Smart max dimensions based on usage context
          let maxWidth = 800;
          let maxHeight = 450;

          if (isFavicon) {
            maxWidth = 48;
            maxHeight = 48;
          } else if (isLogo) {
            maxWidth = 280;
            maxHeight = 80;
          } else if (aspectRatio === 'square') {
            maxWidth = 180;
            maxHeight = 180;
          } else {
            maxWidth = 600;
            maxHeight = 300;
          }

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            
            // Format-aware compression: preserve transparency for PNG, compress JPEG for small footprint
            const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
            const mimeType = isPng ? 'image/png' : 'image/jpeg';
            const quality = isPng ? undefined : 0.80; // 80% JPEG is perfect and keeps size under 30KB
            
            const dataUrl = canvas.toDataURL(mimeType, quality);
            uploadToStorage(dataUrl, file.name);
          } else {
            setUploadError('Could not create canvas context.');
            setIsUploading(false);
          }
        } catch (canvasErr) {
          console.error('Canvas processing error:', canvasErr);
          setUploadError('Failed to process image canvas.');
          setIsUploading(false);
        }
      };
    };
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        compressAndResizeImage(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        compressAndResizeImage(file);
      }
    }
  };

  const onButtonClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUploading) return;
    onChange('');
  };

  return (
    <div className="space-y-2" id={id}>
      <label className="block text-xs font-bold text-green-100/50 uppercase tracking-wider">{label}</label>
      
      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-green-800 bg-[#05130b] flex items-center justify-center p-2">
          {aspectRatio === 'square' ? (
            <img src={value} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-green-900" referrerPolicy="no-referrer" />
          ) : (
            <img src={value} alt="Banner Preview" className="w-full max-h-40 object-cover rounded-lg border border-green-900" referrerPolicy="no-referrer" />
          )}
          
          <button
            type="button"
            onClick={handleDelete}
            className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full transition-colors shadow-lg z-10 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[120px] ${
            dragActive 
              ? 'border-amber-500 bg-amber-500/5' 
              : 'border-green-800 bg-[#05130b]/40 hover:border-amber-500/30'
          } ${isUploading ? 'pointer-events-none opacity-80' : ''}`}
        >
          <input
            id={inputId}
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
          
          {isUploading ? (
            <div className="flex flex-col items-center justify-center space-y-2 py-2">
              <Loader2 className="animate-spin text-amber-500" size={28} />
              <p className="text-xs text-amber-400 font-bold">Uploading to Storage... {uploadProgress}%</p>
              <div className="w-32 bg-green-950 h-1.5 rounded-full overflow-hidden border border-green-900">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <Upload size={24} className="text-green-100/40 mb-2 group-hover:text-amber-500 transition-colors" />
              
              <p className="text-xs text-green-100/70 font-semibold pointer-events-none">
                Drag & Drop or <span className="text-amber-400 font-bold underline">Choose File</span>
              </p>
              {description && (
                <p className="text-[10px] text-green-100/40 mt-1 pointer-events-none">{description}</p>
              )}
              {uploadError && (
                <p className="text-xs text-red-400 mt-2 font-medium pointer-events-none">{uploadError}</p>
              )}
            </div>
          )}
        </label>
      )}
    </div>
  );
}
