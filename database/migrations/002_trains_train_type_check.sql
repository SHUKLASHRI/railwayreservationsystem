-- Optional: expand train_type allowed values (matches database/supabase_schema.sql).
-- Run if inserts fail with check constraint violations after CSV ingest.

ALTER TABLE trains DROP CONSTRAINT IF EXISTS trains_train_type_check;

ALTER TABLE trains ADD CONSTRAINT trains_train_type_check CHECK (
    train_type IN (
        'Superfast', 'Express', 'Passenger', 'Vande Bharat', 'Shatabdi', 'Rajdhani',
        'Mail', 'Duronto', 'Garib Rath'
    )
);
