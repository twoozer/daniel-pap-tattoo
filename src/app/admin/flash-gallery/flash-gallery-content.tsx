'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FlashDesign } from '@/types/booking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TATTOO_STYLES } from '@/lib/utils/constants';
import { Plus, Trash2, Pencil, X } from 'lucide-react';

function getFlashImageUrl(design: FlashDesign): string | null {
  if (design.image_url) return design.image_url;
  if (!design.image_path) return null;
  const supabase = createClient();
  const { data } = supabase.storage.from('flash-designs').getPublicUrl(design.image_path);
  return data.publicUrl;
}

export function AdminFlashGalleryContent() {
  const [designs, setDesigns] = useState<FlashDesign[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDesign, setEditingDesign] = useState<FlashDesign | null>(null);
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

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStyle('');
    setSuggestedSize('');
    setImageFile(null);
    setShowForm(false);
    setEditingDesign(null);
  };

  const startEdit = (design: FlashDesign) => {
    setEditingDesign(design);
    setTitle(design.title);
    setDescription(design.description || '');
    setStyle(design.style || '');
    setSuggestedSize(design.suggested_size || '');
    setImageFile(null);
    setShowForm(true);
  };

  const startNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || (!imageFile && !editingDesign)) return;
    setSubmitting(true);

    let imagePath = editingDesign?.image_path || '';

    // Upload new image if provided
    if (imageFile) {
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

      // Delete old image if replacing
      if (editingDesign?.image_path) {
        await supabase.storage.from('flash-designs').remove([editingDesign.image_path]);
      }

      imagePath = fileName;
    }

    if (editingDesign) {
      // Update existing design
      await supabase
        .from('flash_designs')
        .update({
          title,
          description: description || null,
          style: style || null,
          suggested_size: suggestedSize || null,
          image_path: imagePath,
        })
        .eq('id', editingDesign.id);
    } else {
      // Create new design
      const res = await fetch('/api/flash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          style: style || null,
          image_path: imagePath,
          suggested_size: suggestedSize || null,
          sort_order: designs.length,
        }),
      });

      if (!res.ok) {
        alert('Failed to create design');
        setSubmitting(false);
        return;
      }
    }

    resetForm();
    loadDesigns();
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
        <Button onClick={startNew}>
          <Plus size={16} />
          Add Design
        </Button>
      </div>

      {/* Upload / Edit form */}
      {showForm && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{editingDesign ? 'Edit Flash Design' : 'Upload New Flash Design'}</CardTitle>
              <button onClick={resetForm} className="rounded-full p-1 hover:bg-zinc-100">
                <X size={18} />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <label className="block text-sm font-medium text-zinc-700">
                  {editingDesign ? 'Replace Image (optional)' : 'Image *'}
                </label>
                {editingDesign && (
                  <div className="mt-1 mb-2">
                    <img
                      src={getFlashImageUrl(editingDesign) || ''}
                      alt="Current"
                      className="h-24 w-24 rounded-md object-cover border border-zinc-200"
                    />
                    <p className="mt-1 text-xs text-zinc-400">Current image — upload a new one to replace it</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  required={!editingDesign}
                  className="mt-1 w-full text-sm"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" loading={submitting}>
                  {editingDesign ? 'Save Changes' : 'Upload Design'}
                </Button>
                <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
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
          {designs.map((design) => {
            const imageUrl = getFlashImageUrl(design);
            return (
              <Card key={design.id} className={!design.is_available ? 'opacity-50' : ''}>
                <div className="aspect-square bg-zinc-100 overflow-hidden">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={design.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-300">
                      <span className="text-sm">No image</span>
                    </div>
                  )}
                </div>
                <CardContent className="py-3">
                  <p className="font-medium">{design.title}</p>
                  {design.style && <p className="text-xs capitalize text-zinc-400">{design.style.replace('-', ' ')}</p>}
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(design)}
                    >
                      <Pencil size={14} />
                    </Button>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
