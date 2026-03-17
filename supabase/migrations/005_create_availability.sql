CREATE TABLE availability (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week  INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  is_working   BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(day_of_week)
);

CREATE TABLE blocked_dates (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date    DATE NOT NULL UNIQUE,
  reason  TEXT
);

CREATE INDEX idx_blocked_dates_date ON blocked_dates(date);

ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read availability" ON availability
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage availability" ON availability
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public can read blocked dates" ON blocked_dates
  FOR SELECT USING (true);

CREATE POLICY "Authenticated can manage blocked dates" ON blocked_dates
  FOR ALL USING (auth.role() = 'authenticated');
