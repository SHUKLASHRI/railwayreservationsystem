-- Run in Supabase SQL Editor if your database was created with the older schema
-- that had UNIQUE (train_id, station_id) on train_schedules (breaks full-route CSV data).

ALTER TABLE train_schedules DROP CONSTRAINT IF EXISTS train_schedules_train_id_station_id_key;

-- Ensure the intended uniqueness (matches CSV ingest ON CONFLICT)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'train_schedules_train_id_stop_sequence_key'
    ) THEN
        ALTER TABLE train_schedules
            ADD CONSTRAINT train_schedules_train_id_stop_sequence_key UNIQUE (train_id, stop_sequence);
    END IF;
END $$;
