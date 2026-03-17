'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PriceTier } from '@/types/booking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatPriceShort } from '@/lib/utils/pricing';

export function AdminPricingContent() {
  const [tiers, setTiers] = useState<PriceTier[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const loadTiers = async () => {
    const { data } = await supabase.from('price_tiers').select('*').order('sort_order');
    setTiers((data as PriceTier[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    loadTiers();
  }, []);

  const updateTier = async (id: string, updates: Partial<PriceTier>) => {
    await supabase.from('price_tiers').update(updates).eq('id', id);
    setEditing(null);
    loadTiers();
  };

  if (loading) {
    return <p className="text-sm text-zinc-400">Loading...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Pricing</h1>
      <p className="mt-1 text-sm text-zinc-500">Manage your price tiers and deposit settings</p>

      <div className="mt-6 space-y-4">
        {tiers.map((tier) => (
          <Card key={tier.id}>
            <CardContent className="py-4">
              {editing === tier.id ? (
                <TierEditForm
                  tier={tier}
                  onSave={(updates) => updateTier(tier.id, updates)}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{tier.display_name}</p>
                    <p className="text-sm text-zinc-500">{tier.description}</p>
                    <div className="mt-1 flex gap-4 text-sm text-zinc-600">
                      <span>
                        Price: {tier.price_pence ? formatPriceShort(tier.price_pence) : 'TBD'}
                      </span>
                      <span>Duration: {tier.estimated_hours ? `${tier.estimated_hours}h` : 'TBD'}</span>
                      <span>Deposit: {tier.deposit_percent}%</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setEditing(tier.id)}>
                    Edit
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TierEditForm({
  tier,
  onSave,
  onCancel,
}: {
  tier: PriceTier;
  onSave: (updates: Partial<PriceTier>) => void;
  onCancel: () => void;
}) {
  const [displayName, setDisplayName] = useState(tier.display_name);
  const [desc, setDesc] = useState(tier.description || '');
  const [price, setPrice] = useState(tier.price_pence ? (tier.price_pence / 100).toString() : '');
  const [hours, setHours] = useState(tier.estimated_hours.toString());
  const [depositPercent, setDepositPercent] = useState(tier.deposit_percent.toString());

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-zinc-500">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500">Description</label>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-zinc-500">Price ($)</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Leave blank for TBD"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500">Estimated Hours</label>
          <input
            type="number"
            step="0.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500">Deposit %</label>
          <input
            type="number"
            value={depositPercent}
            onChange={(e) => setDepositPercent(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() =>
            onSave({
              display_name: displayName,
              description: desc || null,
              price_pence: price ? Math.round(parseFloat(price) * 100) : null,
              estimated_hours: parseFloat(hours) || 0,
              deposit_percent: parseInt(depositPercent) || 20,
            })
          }
        >
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
