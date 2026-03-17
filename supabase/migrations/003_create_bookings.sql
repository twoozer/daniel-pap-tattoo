CREATE TABLE bookings (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

  booking_type                TEXT NOT NULL DEFAULT 'standard'
    CHECK (booking_type IN ('standard', 'consultation', 'custom_quote')),

  customer_name               TEXT NOT NULL,
  customer_email              TEXT NOT NULL,
  customer_phone              TEXT,

  size_category               TEXT CHECK (size_category IN ('tiny', 'small', 'medium', 'large', 'custom')),
  body_placement              TEXT,
  style                       TEXT,
  description                 TEXT,

  flash_design_id             UUID REFERENCES flash_designs(id) ON DELETE SET NULL,
  reference_images            TEXT[] DEFAULT '{}',

  appointment_date            DATE,
  appointment_start_time      TIME,
  appointment_end_time        TIME,
  estimated_duration_hrs      NUMERIC(3,1),

  total_price                 INTEGER,
  deposit_amount              INTEGER,
  deposit_paid                BOOLEAN NOT NULL DEFAULT false,

  stripe_checkout_session_id  TEXT,
  stripe_payment_intent_id    TEXT,
  google_calendar_event_id    TEXT,

  status                      TEXT NOT NULL DEFAULT 'pending_deposit'
    CHECK (status IN (
      'pending_deposit',
      'deposit_paid',
      'custom_quote_pending',
      'consultation_booked',
      'confirmed',
      'completed',
      'cancelled',
      'no_show'
    )),

  access_token                TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  artist_notes                TEXT,
  consultation_notes          TEXT
);

CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_appointment_date ON bookings(appointment_date);
CREATE INDEX idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX idx_bookings_access_token ON bookings(access_token);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage bookings" ON bookings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
