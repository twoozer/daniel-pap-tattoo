'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FlashDesign } from '@/types/booking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TATTOO_STYLES } from '@/lib/utils/constants';
import { Plus, Trash2 } from 'lucide-react';

export function AdminFlashGalleryContent() {
  const [designs, setDesigns] = useState<FlashDesign[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [style, setStyle] = useState('');
  const [suggestedSize, setSuggestedSize] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  const loadDesigns = async () => {
    const { data } = await supabase
      .from('flash_designs')
      .select('*')
      .order('sort_order');
    setDesigns((data as FlashDesign[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    loadDesigns();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageFile) return;
    setSubmitting(true);

    // Upload image to Supabase Storage
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('flash-designs')
      .upload(fileName, imageFile);

    if (uploadError) {
      alert('Image upload failed: ' + uploadError.message);
      setSubmitting(false);
      return;
    }

    // Create flash design record
    const res = await fetch('/api/flash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description: description || null,
        style: style || null,
        image_path: fileName,
        suggested_size: suggestedSize || null,
        sort_order: designs.length,
      }),
    });

    if (res.ok) {
      setTitle('');
      setDescription('');
      setStyle('');
      setSuggestedSize('');
      setImageFile(null);
      setShowForm(false);
      loadDesigns();
    }
    setSubmitting(false);
  };

  const handleDelete = async (design: FlashDesign) => {
    if (!confirm(`Delete "${design.title}"?`)) return;

    // Delete from storage
    await supabase.storage.from('flash-designs').remove([design.image_path]);
    // Delete record
    await fetch(`/api/flash?id=${design.id}`, { method: 'DELETE' });
    loadDesigns();
  };

  const handleToggleAvailability = async (design: FlashDesign) => {
    await supabase
      .from('flash_designs')
      .update({ is_available: !design.is_available })
      .eq('id', design.id);
    loadDesigns();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Flash Gallery</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage your flash designs</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={16} />
          Add Design
        </Button>
      </div>

      {/* Upload form */}
      {showForm && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Upload New Flash Design</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700">Style</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">Select style...</option>
                    {TATTOO_STYLES.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700">Suggested Size</label>
                  <select
                    value={suggestedSize}
                    onChange={(e) => setSuggestedSize(e.target.value)}
                    className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">Select size...</option>
                    <option value="tiny">Tiny</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">Image *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  required
                  className="mt-1 w-full text-sm"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" loading={submitting}>Upload Design</Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Designs grid */}
      {loading ? (
        <p className="mt-8 text-center text-sm text-zinc-400">Loading designs...</p>
      ) : designs.length === 0 ? (
        <Card className="mt-8">
          <CardContent>
            <p className="py-8 text-center text-sm text-zinc-400">
              No flash designs yet. Click &quot;Add Design&quot; to upload your first one.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {designs.map((design) => (
            <Card key={design.id} className={!design.is_available ? 'opacity-50' : ''}>
              <div className="aspect-square bg-zinc-100">
                <div className="flex h-full items-center justify-center text-zinc-300">
                  <span className="text-4xl">&#x1F3A8;</span>
                </div>
              </div>
              <CardContent className="py-3">
                <p className="font-medium">{design.title}</p>
                {design.style && <p className="text-xs capitalize text-zinc-400">{design.style.replace('-', ' ')}</p>}
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={design.is_available ? 'outline' : 'secondary'}
                    onClick={() => handleToggleAvailability(design)}
                  >
                    {design.is_available ? 'Hide' : 'Show'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(design)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
