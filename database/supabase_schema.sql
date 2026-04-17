-- Supabase (PostgreSQL) Compatible Railway Reservation System Schema

-- Enable necessary extensions
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- TRIGGER FUNCTION FOR UPDATED_AT
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==============================================================================
-- 1. LOCATION & STATIONS MASTER
-- ==============================================================================
CREATE TABLE stations (
    station_id SERIAL PRIMARY KEY,
    station_code VARCHAR(10) NOT NULL UNIQUE,
    station_name VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    pin_code VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_station_code ON stations(station_code);

-- ==============================================================================
-- 2. TRAINS MASTER
-- ==============================================================================
CREATE TABLE trains (
    train_id SERIAL PRIMARY KEY,
    train_number VARCHAR(10) NOT NULL UNIQUE,
    train_name VARCHAR(100) NOT NULL,
    train_type VARCHAR(20) NOT NULL DEFAULT 'Express' CHECK (train_type IN ('Superfast', 'Express', 'Passenger', 'Vande Bharat', 'Shatabdi', 'Rajdhani')),
    source_station_id INT NOT NULL,
    destination_station_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_station_id) REFERENCES stations(station_id) ON DELETE RESTRICT,
    FOREIGN KEY (destination_station_id) REFERENCES stations(station_id) ON DELETE RESTRICT
);
CREATE INDEX idx_train_number ON trains(train_number);

CREATE TRIGGER update_trains_updated_at BEFORE UPDATE ON trains FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 3. TRAIN SCHEDULE (ROUTE/STOPS)
-- ==============================================================================
CREATE TABLE train_schedules (
    schedule_id SERIAL PRIMARY KEY,
    train_id INT NOT NULL,
    station_id INT NOT NULL,
    stop_sequence INT NOT NULL CHECK (stop_sequence > 0),
    arrival_time TIME NOT NULL,
    departure_time TIME NOT NULL,
    day_count INT NOT NULL DEFAULT 1,
    distance_from_source DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (train_id, stop_sequence),
    UNIQUE (train_id, station_id),
    FOREIGN KEY (train_id) REFERENCES trains(train_id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE RESTRICT
);

-- ==============================================================================
-- 4. TRAIN SEATING/CLASS CONFIGURATION
-- ==============================================================================
CREATE TABLE train_classes (
    class_id SERIAL PRIMARY KEY,
    class_code VARCHAR(5) NOT NULL UNIQUE,
    class_name VARCHAR(50) NOT NULL
);

CREATE TABLE train_seat_configurations (
    config_id SERIAL PRIMARY KEY,
    train_id INT NOT NULL,
    class_id INT NOT NULL,
    total_seats INT NOT NULL CHECK (total_seats >= 0),
    base_fare DECIMAL(10,2) NOT NULL CHECK (base_fare >= 0),
    UNIQUE (train_id, class_id),
    FOREIGN KEY (train_id) REFERENCES trains(train_id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES train_classes(class_id) ON DELETE RESTRICT
);

-- ==============================================================================
-- 5. TRAIN INSTANCES (SPECIFIC JOURNEYS)
-- ==============================================================================
CREATE TABLE train_instances (
    instance_id SERIAL PRIMARY KEY,
    train_id INT NOT NULL,
    journey_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ON_TIME' CHECK (status IN ('ON_TIME', 'DELAYED', 'CANCELLED', 'COMPLETED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (train_id, journey_date),
    FOREIGN KEY (train_id) REFERENCES trains(train_id) ON DELETE RESTRICT
);
CREATE INDEX idx_journey_date ON train_instances(journey_date);

-- ==============================================================================
-- 6. USERS (CUSTOMERS & ADMINS)
-- ==============================================================================
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    role VARCHAR(10) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'agent')),
    account_status VARCHAR(15) NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'DELETED')),
    otp_secret VARCHAR(32) DEFAULT NULL,
    last_login TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_phone ON users(phone);

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 7. BOOKINGS
-- ==============================================================================
CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    instance_id INT NOT NULL,
    pnr VARCHAR(10) NOT NULL UNIQUE,
    total_fare DECIMAL(10, 2) NOT NULL CHECK (total_fare >= 0),
    status VARCHAR(25) NOT NULL CHECK (status IN ('CONFIRMED', 'PARTIALLY_CONFIRMED', 'WAITLISTED', 'CANCELLED')),
    booking_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (instance_id) REFERENCES train_instances(instance_id) ON DELETE RESTRICT
);
CREATE INDEX idx_pnr ON bookings(pnr);
CREATE INDEX idx_booking_user ON bookings(user_id);
CREATE INDEX idx_booking_instance ON bookings(instance_id);

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 8. PASSENGERS (TICKET DETAILS)
-- ==============================================================================
CREATE TABLE passengers (
    passenger_id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    age INT NOT NULL CHECK (age >= 0 AND age <= 120),
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    class_id INT NOT NULL,
    status VARCHAR(15) NOT NULL CHECK (status IN ('CONFIRMED', 'RAC', 'WAITLISTED', 'CANCELLED')),
    coach_number VARCHAR(10) DEFAULT NULL,
    seat_number INT DEFAULT NULL,
    waiting_list_number INT DEFAULT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES train_classes(class_id) ON DELETE RESTRICT,
    CONSTRAINT chk_passenger_allocation CHECK (
        (status = 'CONFIRMED' AND seat_number IS NOT NULL AND coach_number IS NOT NULL AND waiting_list_number IS NULL) OR
        (status = 'WAITLISTED' AND seat_number IS NULL AND coach_number IS NULL AND waiting_list_number IS NOT NULL) OR
        (status = 'RAC' AND seat_number IS NOT NULL AND coach_number IS NOT NULL AND waiting_list_number IS NULL) OR
        (status = 'CANCELLED')
    )
);

-- ==============================================================================
-- 9. PAYMENTS
-- ==============================================================================
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'WALLET')),
    status VARCHAR(15) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING', 'REFUNDED')),
    payment_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE RESTRICT
);
CREATE INDEX idx_transaction_id ON payments(transaction_id);

-- ==============================================================================
-- 10. REFUNDS
-- ==============================================================================
CREATE TABLE refunds (
    refund_id SERIAL PRIMARY KEY,
    payment_id INT NOT NULL,
    booking_id INT NOT NULL,
    refund_amount DECIMAL(10, 2) NOT NULL CHECK (refund_amount > 0),
    status VARCHAR(15) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED')),
    processed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE RESTRICT,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE RESTRICT
);

-- ==============================================================================
-- 11. AUDIT LOGS
-- ==============================================================================
CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT NULL,
    action_type VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45) NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
