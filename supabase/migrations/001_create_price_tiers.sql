CREATE TABLE price_tiers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  size_category     TEXT NOT NULL UNIQUE
    CHECK (size_category IN ('tiny', 'small', 'medium', 'large', 'custom')),
  display_name      TEXT NOT NULL,
  description       TEXT,
  price_pence       INTEGER,
  estimated_hours   NUMERIC(3,1) NOT NULL,
  deposit_percent   INTEGER NOT NULL DEFAULT 20,
  is_auto_bookable  BOOLEAN NOT NULL DEFAULT true,
  sort_order        INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE price_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read prices" ON price_tiers
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage prices" ON price_tiers
  FOR ALL USING (auth.role() = 'authenticated');
