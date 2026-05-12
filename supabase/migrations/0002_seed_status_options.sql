-- 0002_seed_status_options.sql
-- Seed the status dropdown values used across the app and Google Sheet.

insert into status_options (value, label, color, sort_order) values
  ('new',          'New',                    '#6b7280', 0),
  ('mail_sent',    'Mail sent',              '#3b82f6', 1),
  ('followed_up',  'Followed up / Loom sent','#8b5cf6', 2),
  ('replied',      'Replied',               '#f59e0b', 3),
  ('call_booked',  'Call booked',           '#10b981', 4),
  ('closed_won',   'Closed — onboarded',    '#22c55e', 5),
  ('closed_lost',  'Closed — passed',       '#ef4444', 6);
