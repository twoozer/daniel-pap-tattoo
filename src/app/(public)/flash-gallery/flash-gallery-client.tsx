'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FlashDesign } from '@/types/booking';
import { useBookingStore } from '@/hooks/use-booking-store';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function getFlashImageUrl(design: FlashDesign): string | null {
  if (design.image_url) return design.image_url;
  if (!design.image_path) return null;
  const supabase = createClient();
  const { data } = supabase.storage.from('flash-designs').getPublicUrl(design.image_path);
  return data.publicUrl;
}

interface FlashGalleryClientProps {
  designs: FlashDesign[];
  styles: string[];
}

export function FlashGalleryClient({ designs, styles }: FlashGalleryClientProps) {
  const router = useRouter();
  const { setFlashDesign, setBookingType, setStep } = useBookingStore();
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<FlashDesign | null>(null);

  const filtered = selectedStyle
    ? designs.filter((d) => d.style === selectedStyle)
    : designs;

  const handleBookDesign = (design: FlashDesign) => {
    setBookingType('standard');
    setFlashDesign({
      id: design.id,
      title: design.title,
      style: design.style,
      suggestedSize: design.suggested_size,
      imagePath: design.image_path,
      description: design.description,
    });
    setStep(2);
    router.push('/book/size');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold md:text-4xl">Flash Gallery</h1>
        <p className="mt-2 text-zinc-500">
          Ready-to-go designs. Pick one and book it directly.
        </p>
      </div>

      {/* Style filters */}
      {styles.length > 0 && (
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setSelectedStyle(null)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              !selectedStyle ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            All
          </button>
          {styles.map((style) => (
            <button
              key={style}
              onClick={() => setSelectedStyle(style)}
              className={`rounded-full px-4 py-1.5 text-sm capitalize transition-colors ${
                selectedStyle === style ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {style.replace('-', ' ')}
            </button>
          ))}
        </div>
      )}

      {/* Gallery grid */}
      {filtered.length === 0 ? (
        <div className="mt-20 text-center">
          <p className="text-zinc-400">No flash designs available yet. Check back soon!</p>
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((design) => (
            <button
              key={design.id}
              onClick={() => setSelectedDesign(design)}
              className="group overflow-hidden rounded-lg border border-zinc-200 bg-white text-left transition-shadow hover:shadow-md"
            >
              <div className="aspect-square bg-zinc-100">
                {(() => {
                  const url = getFlashImageUrl(design);
                  return url ? (
                    <img src={url} alt={design.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-300">
                      <span className="text-4xl">&#x1F3A8;</span>
                    </div>
                  );
                })()}
              </div>
              <div className="p-3">
                <p className="font-medium">{design.title}</p>
                {design.style && (
                  <p className="mt-0.5 text-xs capitalize text-zinc-400">
                    {design.style.replace('-', ' ')}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Design detail modal */}
      {selectedDesign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white">
            <button
              onClick={() => setSelectedDesign(null)}
              className="absolute right-3 top-3 rounded-full p-1 hover:bg-zinc-100"
            >
              <X size={20} />
            </button>

            <div className="aspect-square bg-zinc-100">
              {(() => {
                const url = getFlashImageUrl(selectedDesign);
                return url ? (
                  <img src={url} alt={selectedDesign.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-300">
                    <span className="text-6xl">&#x1F3A8;</span>
                  </div>
                );
              })()}
            </div>

            <div className="p-6">
              <h2 className="text-xl font-bold">{selectedDesign.title}</h2>
              {selectedDesign.description && (
                <p className="mt-2 text-sm text-zinc-500">{selectedDesign.description}</p>
              )}
              {selectedDesign.style && (
                <p className="mt-2 text-xs capitalize text-zinc-400">
                  Style: {selectedDesign.style.replace('-', ' ')}
                </p>
              )}
              {selectedDesign.suggested_size && (
                <p className="mt-1 text-xs capitalize text-zinc-400">
                  Suggested size: {selectedDesign.suggested_size}
                </p>
              )}

              <div className="mt-6">
                <Button className="w-full" onClick={() => handleBookDesign(selectedDesign)}>
                  Book This Design
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
