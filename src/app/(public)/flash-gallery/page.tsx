import { createAdminClient } from '@/lib/supabase/admin';
import { FlashDesign } from '@/types/booking';
import { FlashGalleryClient } from './flash-gallery-client';
import { IS_PROTOTYPE, MOCK_FLASH_DESIGNS, getMockFlashStyles } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export default async function FlashGalleryPage() {
  let designs: FlashDesign[] = [];
  let styles: string[] = [];

  if (IS_PROTOTYPE) {
    designs = MOCK_FLASH_DESIGNS;
    styles = getMockFlashStyles();
  } else {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('flash_designs')
      .select('*')
      .eq('is_available', true)
      .order('sort_order');

    designs = (data as FlashDesign[]) || [];
    styles = [...new Set(designs.map((d: FlashDesign) => d.style).filter(Boolean))] as string[];
  }

  return <FlashGalleryClient designs={designs} styles={styles} />;
}
