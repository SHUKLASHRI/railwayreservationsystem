-- Seed Data for Supabase (PostgreSQL)

-- 1. Stations
INSERT INTO stations (station_code, station_name, city, state) VALUES
('CSMT', 'Chhatrapati Shivaji Maharaj Terminus', 'Mumbai', 'Maharashtra'),
('NDLS', 'New Delhi Railway Station', 'Delhi', 'Delhi'),
('BCT', 'Mumbai Central', 'Mumbai', 'Maharashtra'),
('MAS', 'Chennai Central', 'Chennai', 'Tamil Nadu'),
('SBC', 'Krantivira Sangolli Rayanna Bengaluru', 'Bengaluru', 'Karnataka');

-- 2. Trains
-- Train 1: Rajdhani Express from Mumbai to Delhi
-- Train 2: Shatabdi from Bengaluru to Chennai
INSERT INTO trains (train_number, train_name, train_type, source_station_id, destination_station_id) VALUES
('12951', 'Mumbai - New Delhi Rajdhani Express', 'Rajdhani', 3, 2),
('12028', 'SBC MAS Shatabdi Express', 'Shatabdi', 5, 4);

-- 3. Train Classes & Configurations
INSERT INTO train_classes (class_code, class_name) VALUES
('1A', 'First Class AC'),
('2A', 'AC 2-Tier'),
('3A', 'AC 3-Tier'),
('SL', 'Sleeper'),
('CC', 'AC Chair Car');

INSERT INTO train_seat_configurations (train_id, class_id, total_seats, base_fare) VALUES
(1, 1, 30,  3500.00), -- Rajdhani 1A
(1, 2, 100, 2500.00), -- Rajdhani 2A
(1, 3, 200, 1500.00), -- Rajdhani 3A
(2, 5, 300, 800.00);  -- Shatabdi CC

-- 4. Train Schedules
INSERT INTO train_schedules (train_id, station_id, stop_sequence, arrival_time, departure_time, day_count) VALUES
(1, 3, 1, '17:00:00', '17:00:00', 1), -- Mumbai Central
(1, 2, 2, '08:32:00', '08:32:00', 2), -- New Delhi
(2, 5, 1, '06:00:00', '06:00:00', 1), -- Bengaluru
(2, 4, 2, '11:00:00', '11:00:00', 1); -- Chennai

-- 5. Train Instances (Specific Dates for Searching)
INSERT INTO train_instances (train_id, journey_date, status) VALUES
(1, '2026-04-01', 'ON_TIME'),
(1, '2026-04-02', 'ON_TIME'),
(1, '2026-04-03', 'ON_TIME'),
(2, '2026-04-01', 'ON_TIME'),
(2, '2026-04-02', 'ON_TIME');
