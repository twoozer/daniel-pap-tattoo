-- Add a dedicated customer_notes column so we stop hijacking artist_notes.
-- Migrate any existing "[Customer Note]" prefixed data across.
ALTER TABLE bookings ADD COLUMN customer_notes TEXT;

-- Migrate existing notes stored in artist_notes with the prefix
UPDATE bookings
SET customer_notes = REPLACE(artist_notes, '[Customer Note] ', ''),
    artist_notes = NULL
WHERE artist_notes LIKE '[Customer Note] %';
