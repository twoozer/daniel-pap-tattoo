CREATE TABLE email_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  error_message TEXT,
  dismissed BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_email_failures_dismissed ON email_failures(dismissed, created_at);

ALTER TABLE email_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage email failures" ON email_failures
  FOR ALL USING (auth.role() = 'authenticated');
