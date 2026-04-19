import sqlite3
import os

DB_PATH = "database/railway.db"

SCHEMA = """
-- 1. STATIONS
CREATE TABLE IF NOT EXISTS stations (
    station_id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_code TEXT NOT NULL UNIQUE,
    station_name TEXT NOT NULL,
    city TEXT,
    state TEXT,
    pin_code TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. TRAINS
CREATE TABLE IF NOT EXISTS trains (
    train_id INTEGER PRIMARY KEY AUTOINCREMENT,
    train_number TEXT NOT NULL UNIQUE,
    train_name TEXT NOT NULL,
    train_type TEXT NOT NULL,
    source_station_id INTEGER NOT NULL,
    destination_station_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_station_id) REFERENCES stations(station_id),
    FOREIGN KEY (destination_station_id) REFERENCES stations(station_id)
);

-- 3. TRAIN SCHEDULE
CREATE TABLE IF NOT EXISTS train_schedules (
    schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
    train_id INTEGER NOT NULL,
    station_id INTEGER NOT NULL,
    stop_sequence INTEGER NOT NULL,
    arrival_time TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    day_count INTEGER DEFAULT 1,
    distance_from_source REAL DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (train_id, stop_sequence),
    FOREIGN KEY (train_id) REFERENCES trains(train_id),
    FOREIGN KEY (station_id) REFERENCES stations(station_id)
);

-- 4. TRAIN CLASSES
CREATE TABLE IF NOT EXISTS train_classes (
    class_id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_code TEXT NOT NULL UNIQUE,
    class_name TEXT NOT NULL
);

-- 5. SEAT CONFIGURATIONS
CREATE TABLE IF NOT EXISTS train_seat_configurations (
    config_id INTEGER PRIMARY KEY AUTOINCREMENT,
    train_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    total_seats INTEGER NOT NULL,
    base_fare REAL NOT NULL,
    UNIQUE (train_id, class_id),
    FOREIGN KEY (train_id) REFERENCES trains(train_id),
    FOREIGN KEY (class_id) REFERENCES train_classes(class_id)
);

-- 6. TRAIN INSTANCES
CREATE TABLE IF NOT EXISTS train_instances (
    instance_id INTEGER PRIMARY KEY AUTOINCREMENT,
    train_id INTEGER NOT NULL,
    journey_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ON_TIME',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (train_id, journey_date),
    FOREIGN KEY (train_id) REFERENCES trains(train_id)
);

-- 7. USERS
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    date_of_birth TEXT,
    gender TEXT,
    role TEXT NOT NULL DEFAULT 'customer',
    account_status TEXT NOT NULL DEFAULT 'ACTIVE',
    otp_secret TEXT,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
    booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    instance_id INTEGER NOT NULL,
    pnr TEXT NOT NULL UNIQUE,
    total_fare REAL NOT NULL,
    status TEXT NOT NULL,
    booking_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (instance_id) REFERENCES train_instances(instance_id)
);

-- 9. PASSENGERS
CREATE TABLE IF NOT EXISTS passengers (
    passenger_id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    class_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    coach_number TEXT,
    seat_number INTEGER,
    waiting_list_number INTEGER,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    FOREIGN KEY (class_id) REFERENCES train_classes(class_id)
);

-- 10. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    transaction_id TEXT NOT NULL UNIQUE,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    payment_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);
"""

def setup():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        cur.executescript(SCHEMA)
        conn.commit()
        print("SQLite schema applied successfully.")
    except Exception as e:
        print(f"Error applying SQLite schema: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    setup()
