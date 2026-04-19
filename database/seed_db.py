from database.db_connection import get_connection

def seed():
    conn = get_connection()
    cur = conn.cursor()
    
    is_sqlite = str(type(conn)).find("sqlite3") != -1

    try:
        # Clear existing data (SQLite compatible)
        print("Cleaning old data...")
        tables = ["passengers", "payments", "bookings", "train_instances", "train_schedules", "train_seat_configurations", "train_classes", "trains", "stations"]
        for table in tables:
            cur.execute(f"DELETE FROM {table};")
        
        if not is_sqlite:
            # For PostgreSQL, we might want to reset identities as well
            cur.execute("COMMIT;")
            cur.execute("BEGIN;")

        # 1. Stations (More comprehensive list)
        stations = [
            ('CSMT', 'Chhatrapati Shivaji Maharaj Terminus', 'Mumbai', 'Maharashtra'),
            ('NDLS', 'New Delhi Railway Station', 'Delhi', 'Delhi'),
            ('BCT', 'Mumbai Central', 'Mumbai', 'Maharashtra'),
            ('MAS', 'Chennai Central', 'Chennai', 'Tamil Nadu'),
            ('SBC', 'KSR Bengaluru City', 'Bengaluru', 'Karnataka'),
            ('HWH', 'Howrah Junction', 'Kolkata', 'West Bengal'),
            ('HYB', 'Hyderabad Deccan', 'Hyderabad', 'Telangana'),
            ('PUNE', 'Pune Junction', 'Pune', 'Maharashtra'),
            ('ADI', 'Ahmedabad Junction', 'Ahmedabad', 'Gujarat'),
            ('JP', 'Jaipur Junction', 'Jaipur', 'Rajasthan'),
            ('LKO', 'Lucknow Charbagh', 'Lucknow', 'Uttar Pradesh'),
            ('PNBE', 'Patna Junction', 'Patna', 'Bihar'),
            ('BPL', 'Bhopal Junction', 'Bhopal', 'Madhya Pradesh'),
            ('NGP', 'Nagpur Junction', 'Nagpur', 'Maharashtra'),
            ('ST', 'Surat', 'Surat', 'Gujarat'),
            ('INDB', 'Indore Junction', 'Indore', 'Madhya Pradesh'),
            ('BRC', 'Vadodara Junction', 'Vadodara', 'Gujarat'),
            ('GHY', 'Guwahati', 'Guwahati', 'Assam'),
            ('BSB', 'Varanasi Junction', 'Varanasi', 'Uttar Pradesh'),
            ('AGC', 'Agra Cantt.', 'Agra', 'Uttar Pradesh'),
            ('MYS', 'Mysuru Junction', 'Mysuru', 'Karnataka'),
            ('MAQ', 'Mangaluru Central', 'Mangaluru', 'Karnataka'),
            ('TVC', 'Thiruvananthapuram Central', 'Trivandrum', 'Kerala'),
            ('ASR', 'Amritsar Junction', 'Amritsar', 'Punjab'),
        ]
        # Convert %s to ? for SQLite compatibility
        q_mark = "?" if is_sqlite else "%s"
        
        cur.executemany(f"INSERT INTO stations (station_code, station_name, city, state) VALUES ({q_mark}, {q_mark}, {q_mark}, {q_mark})", stations)
        print(f"Inserted {len(stations)} stations.")

        # 2. Train Classes
        classes = [
            ('1A', 'First Class AC'),
            ('2A', 'AC 2-Tier'),
            ('3A', 'AC 3-Tier'),
            ('SL', 'Sleeper'),
            ('CC', 'AC Chair Car'),
            ('EC', 'Executive Chair Car'),
            ('3E', 'AC 3 Tier Economy')
        ]
        cur.executemany(f"INSERT INTO train_classes (class_code, class_name) VALUES ({q_mark}, {q_mark})", classes)
        print("Inserted train classes.")

        # 3. Trains (Real famous trains)
        # Getting station IDs
        cur.execute("SELECT station_id, station_code FROM stations")
        s_map = {code: id for id, code in cur.fetchall()}

        trains = [
            ('12951', 'Mumbai Rajdhani Express', 'Rajdhani', s_map['BCT'], s_map['NDLS']),
            ('12301', 'Howrah Rajdhani Express', 'Rajdhani', s_map['HWH'], s_map['NDLS']),
            ('12002', 'Bhopal Shatabdi Express', 'Shatabdi', s_map['NDLS'], s_map['BPL']),
            ('22436', 'Vande Bharat Express', 'Vande Bharat', s_map['NDLS'], s_map['BSB']),
            ('12627', 'Karnataka Express', 'Superfast', s_map['SBC'], s_map['NDLS']),
            ('12925', 'Paschim Express', 'Superfast', s_map['BCT'], s_map['ASR']), # ASR not in list but we can add or ignore
            ('12137', 'Punjab Mail', 'Express', s_map['CSMT'], s_map['NDLS']),
            ('12611', 'Garib Rath Express', 'Express', s_map['MAS'], s_map['NDLS']),
            ('12213', 'Duronto Express', 'Superfast', s_map['SBC'], s_map['NDLS']),
        ]
        
        # Filter trains to only those with valid station IDs in our list
        valid_trains = [t for t in trains if t[3] in s_map.values() and t[4] in s_map.values()]
        cur.executemany(f"INSERT INTO trains (train_number, train_name, train_type, source_station_id, destination_station_id) VALUES ({q_mark}, {q_mark}, {q_mark}, {q_mark}, {q_mark})", valid_trains)
        print(f"Inserted {len(valid_trains)} trains.")

        # 3b. Minimal route (source -> destination) so /api/train/search can match intermediate booking
        cur.execute("SELECT train_id, source_station_id, destination_station_id FROM trains")
        for tid, src_id, dst_id in cur.fetchall():
            cur.execute(
                f"INSERT INTO train_schedules (train_id, station_id, stop_sequence, arrival_time, departure_time, day_count, distance_from_source) VALUES ({q_mark}, {q_mark}, {q_mark}, {q_mark}, {q_mark}, {q_mark}, {q_mark})",
                (tid, src_id, 1, "10:00:00", "10:15:00", 1, 0),
            )
            cur.execute(
                f"INSERT INTO train_schedules (train_id, station_id, stop_sequence, arrival_time, departure_time, day_count, distance_from_source) VALUES ({q_mark}, {q_mark}, {q_mark}, {q_mark}, {q_mark}, {q_mark}, {q_mark})",
                (tid, dst_id, 2, "22:00:00", "22:15:00", 1, 1400),
            )
        print("Inserted minimal train schedules.")

        # 4. Seat Configurations
        cur.execute("SELECT train_id, train_type FROM trains")
        t_list = cur.fetchall()
        cur.execute("SELECT class_id, class_code FROM train_classes")
        c_map = {code: id for id, code in cur.fetchall()}

        configs = []
        for tid, ttype in t_list:
            if ttype == 'Rajdhani':
                configs.extend([(tid, c_map['1A'], 20, 4500), (tid, c_map['2A'], 60, 3200), (tid, c_map['3A'], 180, 2200)])
            elif ttype == 'Shatabdi' or ttype == 'Vande Bharat':
                configs.extend([(tid, c_map['EC'], 50, 2500), (tid, c_map['CC'], 400, 1200)])
            else:
                configs.extend([(tid, c_map['2A'], 40, 2800), (tid, c_map['3A'], 120, 1800), (tid, c_map['SL'], 400, 650)])
        
        cur.executemany(f"INSERT INTO train_seat_configurations (train_id, class_id, total_seats, base_fare) VALUES ({q_mark}, {q_mark}, {q_mark}, {q_mark})", configs)
        print("Inserted seat configurations.")

        # 5. Train Instances (Create instances for the next 30 days)
        import datetime
        cur.execute("SELECT train_id FROM trains")
        all_tids = [r[0] for r in cur.fetchall()]
        instances = []
        today = datetime.date.today()
        for i in range(30):
            date = today + datetime.timedelta(days=i)
            for tid in all_tids:
                instances.append((tid, date, 'ON_TIME'))
        
        cur.executemany(f"INSERT INTO train_instances (train_id, journey_date, status) VALUES ({q_mark}, {q_mark}, {q_mark})", instances)
        print(f"Inserted {len(instances)} train instances.")

        conn.commit()
        print("Seeding completed successfully!")

    except Exception as e:
        conn.rollback()
        print(f"Error seeding database: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    seed()
