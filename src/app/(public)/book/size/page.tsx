import { createAdminClient } from '@/lib/supabase/admin';
import { PriceTier } from '@/types/booking';
import { SizeStepClient } from './size-step-client';
import { IS_PROTOTYPE, MOCK_PRICE_TIERS } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export default async function SizeStepPage() {
  let tiers: PriceTier[] = [];

  if (IS_PROTOTYPE) {
    tiers = MOCK_PRICE_TIERS;
  } else {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('price_tiers')
      .select('*')
      .order('sort_order');
    tiers = (data as PriceTier[]) || [];
  }

  return <SizeStepClient tiers={tiers} />;
}
