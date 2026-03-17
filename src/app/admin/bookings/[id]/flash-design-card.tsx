'use client';

import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';

interface FlashDesignData {
  id: string;
  title: string;
  description: string | null;
  style: string | null;
  image_path: string;
  suggested_size: string | null;
}

function getFlashImageUrl(imagePath: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from('flash-designs').getPublicUrl(imagePath);
  return data.publicUrl;
}

interface FlashDesignCardProps {
  flashDesign: FlashDesignData;
}

export function FlashDesignCard({ flashDesign }: FlashDesignCardProps) {
  return (
    <Card className="mt-6 border-blue-200 bg-blue-50">
      <CardContent className="py-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-600">
          Flash Design Booking
        </p>
        <div className="flex items-start gap-4">
          {flashDesign.image_path && (
            <a
              href={getFlashImageUrl(flashDesign.image_path)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={getFlashImageUrl(flashDesign.image_path)}
                alt={flashDesign.title}
                className="h-24 w-24 rounded-lg object-cover border border-blue-200 hover:opacity-80 transition-opacity"
              />
            </a>
          )}
          <div className="flex-1">
            <p className="text-lg font-semibold text-zinc-900">{flashDesign.title}</p>
            {flashDesign.style && (
              <p className="mt-0.5 text-sm capitalize text-zinc-500">
                {flashDesign.style.replace('-', ' ')}
              </p>
            )}
            {flashDesign.suggested_size && (
              <p className="mt-0.5 text-sm capitalize text-zinc-500">
                Suggested size: {flashDesign.suggested_size}
              </p>
            )}
            {flashDesign.description && (
              <p className="mt-2 text-sm text-zinc-600">{flashDesign.description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
