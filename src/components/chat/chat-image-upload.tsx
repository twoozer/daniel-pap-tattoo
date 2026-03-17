'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ImagePlus, X, Loader2 } from 'lucide-react';

interface ChatImageUploadProps {
  bookingId: string;
  onUploaded: (imagePath: string) => void;
}

export function ChatImageUpload({ bookingId, onUploaded }: ChatImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB');
      return;
    }

    setError('');
    setUploading(true);

    // Show preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const path = `${bookingId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('reference-images')
      .upload(path, file, { contentType: file.type });

    setUploading(false);

    if (uploadError) {
      setError('Upload failed: ' + uploadError.message);
      setPreview(null);
      return;
    }

    onUploaded(path);
    setPreview(null);

    // Reset input
    if (fileRef.current) fileRef.current.value = '';
  };

  const cancelPreview = () => {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="relative">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id={`chat-image-${bookingId}`}
      />
      <label
        htmlFor={`chat-image-${bookingId}`}
        className="flex cursor-pointer items-center justify-center rounded-md border border-zinc-300 p-2 text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700"
      >
        {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
      </label>

      {preview && (
        <div className="absolute bottom-full left-0 mb-2 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg">
          <div className="relative">
            <img src={preview} alt="Preview" className="max-h-32 max-w-48 rounded" />
            {!uploading && (
              <button onClick={cancelPreview} className="absolute -right-2 -top-2 rounded-full bg-zinc-800 p-0.5 text-white">
                <X size={14} />
              </button>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded bg-black/30">
                <Loader2 size={20} className="animate-spin text-white" />
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="absolute bottom-full left-0 mb-2 rounded bg-red-50 px-2 py-1 text-xs text-red-600 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}
