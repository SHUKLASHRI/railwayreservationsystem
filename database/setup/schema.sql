-- Production-Ready Railway Reservation System Schema
-- Fully Normalized, Scalable, and Constraints-Enforced

SET sql_mode = 'STRICT_ALL_TABLES';

-- ==============================================================================
-- 1. LOCATION & STATIONS MASTER
-- ==============================================================================
CREATE TABLE stations (
    station_id INT AUTO_INCREMENT PRIMARY KEY,
    station_code VARCHAR(10) NOT NULL UNIQUE,
    station_name VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    pin_code VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_station_code ON stations(station_code);

-- ==============================================================================
-- 2. TRAINS MASTER
-- ==============================================================================
CREATE TABLE trains (
    train_id INT AUTO_INCREMENT PRIMARY KEY,
    train_number VARCHAR(10) NOT NULL UNIQUE,
    train_name VARCHAR(100) NOT NULL,
    train_type ENUM('Superfast', 'Express', 'Passenger', 'Vande Bharat', 'Shatabdi', 'Rajdhani') NOT NULL DEFAULT 'Express',
    source_station_id INT NOT NULL,
    destination_station_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (source_station_id) REFERENCES stations(station_id) ON DELETE RESTRICT,
    FOREIGN KEY (destination_station_id) REFERENCES stations(station_id) ON DELETE RESTRICT
);
CREATE INDEX idx_train_number ON trains(train_number);

-- ==============================================================================
-- 3. TRAIN SCHEDULE (ROUTE/STOPS)
-- ==============================================================================
CREATE TABLE train_schedules (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    train_id INT NOT NULL,
    station_id INT NOT NULL,
    stop_sequence INT NOT NULL CHECK (stop_sequence > 0),
    arrival_time TIME NOT NULL,
    departure_time TIME NOT NULL,
    day_count INT NOT NULL DEFAULT 1 COMMENT '1 for same day, 2 for next day, etc.',
    distance_from_source DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_train_stop_sequence (train_id, stop_sequence),
    UNIQUE KEY unique_train_station (train_id, station_id),
    FOREIGN KEY (train_id) REFERENCES trains(train_id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE RESTRICT
);

-- ==============================================================================
-- 4. TRAIN SEATING/CLASS CONFIGURATION
-- ==============================================================================
CREATE TABLE train_classes (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    class_code VARCHAR(5) NOT NULL UNIQUE, -- e.g., 1A, 2A, 3A, SL, CC, UR
    class_name VARCHAR(50) NOT NULL
);

CREATE TABLE train_seat_configurations (
    config_id INT AUTO_INCREMENT PRIMARY KEY,
    train_id INT NOT NULL,
    class_id INT NOT NULL,
    total_seats INT NOT NULL CHECK (total_seats >= 0),
    base_fare DECIMAL(10,2) NOT NULL CHECK (base_fare >= 0),
    UNIQUE KEY unique_train_class (train_id, class_id),
    FOREIGN KEY (train_id) REFERENCES trains(train_id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES train_classes(class_id) ON DELETE RESTRICT
);

-- ==============================================================================
-- 5. TRAIN INSTANCES (SPECIFIC JOURNEYS)
-- ==============================================================================
-- A user books a specific instance of a train on a specific date.
CREATE TABLE train_instances (
    instance_id INT AUTO_INCREMENT PRIMARY KEY,
    train_id INT NOT NULL,
    journey_date DATE NOT NULL,
    status ENUM('ON_TIME', 'DELAYED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'ON_TIME',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_train_date (train_id, journey_date),
    FOREIGN KEY (train_id) REFERENCES trains(train_id) ON DELETE RESTRICT
);
CREATE INDEX idx_journey_date ON train_instances(journey_date);

-- ==============================================================================
-- 6. USERS (CUSTOMERS & ADMINS)
-- ==============================================================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    date_of_birth DATE,
    gender ENUM('Male', 'Female', 'Other'),
    role ENUM('customer', 'admin', 'agent') NOT NULL DEFAULT 'customer',
    account_status ENUM('ACTIVE', 'SUSPENDED', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
    otp_secret VARCHAR(32) DEFAULT NULL,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_phone ON users(phone);

-- ==============================================================================
-- 7. BOOKINGS
-- ==============================================================================
CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    instance_id INT NOT NULL,
    pnr VARCHAR(10) NOT NULL UNIQUE,
    total_fare DECIMAL(10, 2) NOT NULL CHECK (total_fare >= 0),
    status ENUM('CONFIRMED', 'PARTIALLY_CONFIRMED', 'WAITLISTED', 'CANCELLED') NOT NULL,
    booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (instance_id) REFERENCES train_instances(instance_id) ON DELETE RESTRICT
);
CREATE INDEX idx_pnr ON bookings(pnr);
CREATE INDEX idx_booking_user ON bookings(user_id);
CREATE INDEX idx_booking_instance ON bookings(instance_id);

-- ==============================================================================
-- 8. PASSENGERS (TICKET DETAILS)
-- ==============================================================================
-- One booking can contain multiple passengers.
CREATE TABLE passengers (
    passenger_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    age INT NOT NULL CHECK (age >= 0 AND age <= 120),
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    class_id INT NOT NULL,
    status ENUM('CONFIRMED', 'RAC', 'WAITLISTED', 'CANCELLED') NOT NULL,
    coach_number VARCHAR(10) DEFAULT NULL,    -- e.g., 'S1', 'B2', 'A1'
    seat_number INT DEFAULT NULL,
    waiting_list_number INT DEFAULT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES train_classes(class_id) ON DELETE RESTRICT,
    -- Ensure logical allocation constraints for production
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
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    payment_method ENUM('CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'WALLET') NOT NULL,
    status ENUM('SUCCESS', 'FAILED', 'PENDING', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    payment_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE RESTRICT
);
CREATE INDEX idx_transaction_id ON payments(transaction_id);

-- ==============================================================================
-- 10. REFUNDS (FINANCIAL TRACKING)
-- ==============================================================================
CREATE TABLE refunds (
    refund_id INT AUTO_INCREMENT PRIMARY KEY,
    payment_id INT NOT NULL,
    booking_id INT NOT NULL,
    refund_amount DECIMAL(10, 2) NOT NULL CHECK (refund_amount > 0),
    status ENUM('PENDING', 'PROCESSED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE RESTRICT,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE RESTRICT
);

-- ==============================================================================
-- 11. AUDIT LOGS (SECURITY & TRACKING)
-- ==============================================================================
CREATE TABLE audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action_type VARCHAR(50) NOT NULL, -- e.g., 'BOOKING_CREATED', 'LOGIN_FAILED'
    ip_address VARCHAR(45) NULL,      -- Supports IPv4 and IPv6
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);