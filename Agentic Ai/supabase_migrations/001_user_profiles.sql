-- Run once in the Supabase SQL editor on databases created from an earlier supabase_schema.sql.
-- Adds the editable profile field used by Student/Faculty accounts and removes the demo
-- Student/Faculty seed rows. The admin row is left untouched.

ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;

DELETE FROM users
WHERE email IN ('organizer@jklu.edu.in', 'faculty@jklu.edu.in')
  AND role IN ('organizer', 'faculty');
