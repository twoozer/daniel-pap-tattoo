INSERT INTO price_tiers (size_category, display_name, description, price_pence, estimated_hours, is_auto_bookable, sort_order)
VALUES
  ('tiny', 'Tiny', 'Finger, behind ear, small symbol', 8000, 1.0, true, 1),
  ('small', 'Small', 'Palm-sized, wrist, ankle', 15000, 2.0, true, 2),
  ('medium', 'Medium', 'A4 size, half-sleeve, forearm', 35000, 4.0, true, 3),
  ('large', 'Large', 'Full sleeve, thigh piece', 60000, 8.0, true, 4),
  ('custom', 'Extra Large / Custom', 'Back piece, full body section, or unsure about size', NULL, 0, false, 5);

INSERT INTO availability (day_of_week, start_time, end_time, is_working)
VALUES
  (0, '10:00', '18:00', false),
  (1, '10:00', '18:00', false),
  (2, '10:00', '18:00', true),
  (3, '10:00', '18:00', true),
  (4, '10:00', '18:00', true),
  (5, '10:00', '18:00', true),
  (6, '10:00', '18:00', true);
