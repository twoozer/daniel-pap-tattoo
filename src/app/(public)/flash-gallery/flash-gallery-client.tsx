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

      {/* Instagram CTA */}
      <div className="mt-16 rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center">
        <h2 className="text-xl font-bold md:text-2xl">Looking for more tattoo ideas?</h2>
        <p className="mt-2 text-zinc-500">
          Check out my Instagram for the latest work, healed tattoos, and design inspiration.
        </p>
        <a
          href="https://www.instagram.com/danielpap/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-md bg-black px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          Follow @danielpap
        </a>
      </div>

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
