CREATE TABLE flash_designs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  title           TEXT NOT NULL,
  description     TEXT,
  style           TEXT,
  image_path      TEXT NOT NULL,
  suggested_size  TEXT CHECK (suggested_size IN ('tiny', 'small', 'medium', 'large', 'custom')),
  is_available    BOOLEAN NOT NULL DEFAULT true,
  sort_order      INTEGER DEFAULT 0,
  tags            TEXT[] DEFAULT '{}'
);

CREATE INDEX idx_flash_designs_available ON flash_designs(is_available);
CREATE INDEX idx_flash_designs_style ON flash_designs(style);

ALTER TABLE flash_designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view available flash" ON flash_designs
  FOR SELECT USING (is_available = true);

CREATE POLICY "Authenticated can manage flash" ON flash_designs
  FOR ALL USING (auth.role() = 'authenticated');
