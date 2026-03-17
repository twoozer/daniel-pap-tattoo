'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2, X } from 'lucide-react';

interface CustomerEditFormProps {
  email: string;
  currentName: string;
  currentPhone: string | null;
  currentNotes: string | null;
  bookingCount: number;
}

export function CustomerEditForm({ email, currentName, currentPhone, currentNotes, bookingCount }: CustomerEditFormProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState(currentName);
  const [phone, setPhone] = useState(currentPhone || '');
  const [notes, setNotes] = useState(currentNotes || '');

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          customer_name: name.trim(),
          customer_phone: phone.trim() || null,
          customer_notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save');
      } else {
        setSuccess('Customer details updated');
        setEditing(false);
        router.refresh();
      }
    } catch {
      setError('Network error');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/admin/customers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to delete');
        setSaving(false);
      } else {
        router.push('/admin/customers');
      }
    } catch {
      setError('Network error');
      setSaving(false);
    }
  };

  return (
    <div className="mt-6">
      {success && (
        <div className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>
      )}

      {!editing && !deleting && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { setEditing(true); setSuccess(''); }}>
            <Pencil size={14} className="mr-1" /> Edit Customer
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => { setDeleting(true); setSuccess(''); }}
          >
            <Trash2 size={14} className="mr-1" /> Delete Customer
          </Button>
        </div>
      )}

      {editing && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Edit Customer Details</CardTitle>
              <button onClick={() => { setEditing(false); setError(''); }} className="text-zinc-400 hover:text-zinc-600">
                <X size={18} />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {error && <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">Email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500"
                />
                <p className="mt-1 text-xs text-zinc-400">Email cannot be changed (used as customer identifier)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">Internal Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Private notes about this customer (not visible to them)..."
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={handleSave} loading={saving}>Save Changes</Button>
              <Button variant="ghost" onClick={() => { setEditing(false); setError(''); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {deleting && (
        <Card className="border-red-200">
          <CardContent className="py-4">
            <h3 className="font-semibold text-red-600">Delete Customer</h3>
            <p className="mt-2 text-sm text-zinc-600">
              This will permanently delete <strong>{currentName}</strong> and all {bookingCount} associated booking{bookingCount !== 1 ? 's' : ''}, messages, and data. This action cannot be undone.
            </p>
            {error && <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
            <div className="mt-4 flex gap-2">
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={handleDelete}
                loading={saving}
              >
                Yes, Delete Everything
              </Button>
              <Button variant="ghost" onClick={() => { setDeleting(false); setError(''); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
