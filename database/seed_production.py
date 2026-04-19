import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# 300+ major Indian railway stations with correct codes, names, cities, states
STATIONS = [
    ('NDLS', 'New Delhi', 'New Delhi', 'Delhi'),
    ('DLI', 'Delhi Junction', 'Delhi', 'Delhi'),
    ('NZM', 'Hazrat Nizamuddin', 'New Delhi', 'Delhi'),
    ('DSA', 'Delhi Sarai Rohilla', 'Delhi', 'Delhi'),
    ('BCT', 'Mumbai Central', 'Mumbai', 'Maharashtra'),
    ('CSMT', 'Chhatrapati Shivaji Maharaj Terminus', 'Mumbai', 'Maharashtra'),
    ('LTT', 'Lokmanya Tilak Terminus', 'Mumbai', 'Maharashtra'),
    ('DR', 'Dadar', 'Mumbai', 'Maharashtra'),
    ('TNA', 'Thane', 'Thane', 'Maharashtra'),
    ('MAS', 'Chennai Central', 'Chennai', 'Tamil Nadu'),
    ('MS', 'Chennai Egmore', 'Chennai', 'Tamil Nadu'),
    ('MBM', 'Chennai Beach', 'Chennai', 'Tamil Nadu'),
    ('SBC', 'KSR Bengaluru City', 'Bengaluru', 'Karnataka'),
    ('BNC', 'Bengaluru Cantonment', 'Bengaluru', 'Karnataka'),
    ('YPR', 'Yeshwanthpur Junction', 'Bengaluru', 'Karnataka'),
    ('HWH', 'Howrah Junction', 'Kolkata', 'West Bengal'),
    ('KOAA', 'Kolkata', 'Kolkata', 'West Bengal'),
    ('SDAH', 'Sealdah', 'Kolkata', 'West Bengal'),
    ('BBI', 'Bhubaneswar', 'Bhubaneswar', 'Odisha'),
    ('CTC', 'Cuttack', 'Cuttack', 'Odisha'),
    ('HYB', 'Hyderabad Deccan Nampally', 'Hyderabad', 'Telangana'),
    ('SC', 'Secunderabad Junction', 'Hyderabad', 'Telangana'),
    ('KCG', 'Kacheguda', 'Hyderabad', 'Telangana'),
    ('PUNE', 'Pune Junction', 'Pune', 'Maharashtra'),
    ('PNP', 'Pune Panchavati Express Stn.', 'Pune', 'Maharashtra'),
    ('ADI', 'Ahmedabad Junction', 'Ahmedabad', 'Gujarat'),
    ('ST', 'Surat', 'Surat', 'Gujarat'),
    ('BRC', 'Vadodara Junction', 'Vadodara', 'Gujarat'),
    ('RJT', 'Rajkot Junction', 'Rajkot', 'Gujarat'),
    ('JP', 'Jaipur Junction', 'Jaipur', 'Rajasthan'),
    ('AII', 'Ajmer Junction', 'Ajmer', 'Rajasthan'),
    ('JU', 'Jodhpur Junction', 'Jodhpur', 'Rajasthan'),
    ('UDZ', 'Udaipur City', 'Udaipur', 'Rajasthan'),
    ('BKN', 'Bikaner Junction', 'Bikaner', 'Rajasthan'),
    ('LKO', 'Lucknow Charbagh NR', 'Lucknow', 'Uttar Pradesh'),
    ('LJN', 'Lucknow Junction NER', 'Lucknow', 'Uttar Pradesh'),
    ('CNB', 'Kanpur Central', 'Kanpur', 'Uttar Pradesh'),
    ('AGC', 'Agra Cantt.', 'Agra', 'Uttar Pradesh'),
    ('AF', 'Agra Fort', 'Agra', 'Uttar Pradesh'),
    ('PRYJ', 'Prayagraj Junction', 'Prayagraj', 'Uttar Pradesh'),
    ('ALD', 'Prayagraj Allahabad City', 'Prayagraj', 'Uttar Pradesh'),
    ('BSB', 'Varanasi Junction', 'Varanasi', 'Uttar Pradesh'),
    ('MUV', 'Manduadih', 'Varanasi', 'Uttar Pradesh'),
    ('GKP', 'Gorakhpur Junction', 'Gorakhpur', 'Uttar Pradesh'),
    ('MB', 'Moradabad Junction', 'Moradabad', 'Uttar Pradesh'),
    ('SV', 'Saharanpur', 'Saharanpur', 'Uttar Pradesh'),
    ('PNBE', 'Patna Junction', 'Patna', 'Bihar'),
    ('RJPB', 'Rajendra Nagar Terminal', 'Patna', 'Bihar'),
    ('GAYA', 'Gaya Junction', 'Gaya', 'Bihar'),
    ('MFP', 'Muzaffarpur Junction', 'Muzaffarpur', 'Bihar'),
    ('BGP', 'Bhagalpur', 'Bhagalpur', 'Bihar'),
    ('RXL', 'Raxaul Junction', 'East Champaran', 'Bihar'),
    ('NGP', 'Nagpur Junction', 'Nagpur', 'Maharashtra'),
    ('CSTM', 'Mumbai CSMT', 'Mumbai', 'Maharashtra'),
    ('BPL', 'Bhopal Junction', 'Bhopal', 'Madhya Pradesh'),
    ('HBJ', 'Habibganj', 'Bhopal', 'Madhya Pradesh'),
    ('INDB', 'Indore Junction', 'Indore', 'Madhya Pradesh'),
    ('GWL', 'Gwalior Junction', 'Gwalior', 'Madhya Pradesh'),
    ('JBP', 'Jabalpur Junction', 'Jabalpur', 'Madhya Pradesh'),
    ('KCVL', 'Trivandrum Central', 'Thiruvananthapuram', 'Kerala'),
    ('TVC', 'Thiruvananthapuram Central', 'Thiruvananthapuram', 'Kerala'),
    ('ERS', 'Ernakulam Junction', 'Kochi', 'Kerala'),
    ('ERN', 'Ernakulam Town', 'Kochi', 'Kerala'),
    ('CLT', 'Kozhikode', 'Kozhikode', 'Kerala'),
    ('SRR', 'Shoranur Junction', 'Palakkad', 'Kerala'),
    ('TLY', 'Tirupur', 'Tirupur', 'Tamil Nadu'),
    ('CBE', 'Coimbatore Junction', 'Coimbatore', 'Tamil Nadu'),
    ('MDU', 'Madurai Junction', 'Madurai', 'Tamil Nadu'),
    ('TPJ', 'Tiruchchirapalli Junction', 'Tiruchchirapalli', 'Tamil Nadu'),
    ('SA', 'Salem Junction', 'Salem', 'Tamil Nadu'),
    ('ED', 'Erode Junction', 'Erode', 'Tamil Nadu'),
    ('MYS', 'Mysuru Junction', 'Mysuru', 'Karnataka'),
    ('UBL', 'Hubli Junction', 'Hubli', 'Karnataka'),
    ('BGM', 'Belagavi', 'Belagavi', 'Karnataka'),
    ('GNT', 'Guntur Junction', 'Guntur', 'Andhra Pradesh'),
    ('BZA', 'Vijayawada Junction', 'Vijayawada', 'Andhra Pradesh'),
    ('VSKP', 'Visakhapatnam Junction', 'Visakhapatnam', 'Andhra Pradesh'),
    ('TIG', 'Tirupati', 'Tirupati', 'Andhra Pradesh'),
    ('GHY', 'Guwahati', 'Guwahati', 'Assam'),
    ('DBRG', 'Dibrugarh Town', 'Dibrugarh', 'Assam'),
    ('AGTL', 'Agartala', 'Agartala', 'Tripura'),
    ('DBG', 'Darbhanga Junction', 'Darbhanga', 'Bihar'),
    ('SHC', 'Sitamarhi', 'Sitamarhi', 'Bihar'),
    ('RNC', 'Ranchi', 'Ranchi', 'Jharkhand'),
    ('DHN', 'Dhanbad Junction', 'Dhanbad', 'Jharkhand'),
    ('TATA', 'Tatanagar Junction', 'Jamshedpur', 'Jharkhand'),
    ('BWN', 'Barddhaman Junction', 'Bardhaman', 'West Bengal'),
    ('BDC', 'Bandel Junction', 'Hooghly', 'West Bengal'),
    ('ASN', 'Asansol Junction', 'Asansol', 'West Bengal'),
    ('NJP', 'New Jalpaiguri', 'Siliguri', 'West Bengal'),
    ('MLDT', 'Malda Town', 'Malda', 'West Bengal'),
    ('AMB', 'Ambala Cantonment', 'Ambala', 'Haryana'),
    ('UMB', 'Ambala City', 'Ambala', 'Haryana'),
    ('FDB', 'Faridabad', 'Faridabad', 'Haryana'),
    ('ASR', 'Amritsar Junction', 'Amritsar', 'Punjab'),
    ('LDH', 'Ludhiana Junction', 'Ludhiana', 'Punjab'),
    ('JAT', 'Jammu Tawi', 'Jammu', 'Jammu & Kashmir'),
    ('SVDK', 'Shri Mata Vaishno Devi Katra', 'Katra', 'Jammu & Kashmir'),
    ('CDG', 'Chandigarh', 'Chandigarh', 'Chandigarh'),
    ('DRN', 'Dehradun', 'Dehradun', 'Uttarakhand'),
    ('HW', 'Haridwar Junction', 'Haridwar', 'Uttarakhand'),
    ('SPN', 'Shimla', 'Shimla', 'Himachal Pradesh'),
    ('RE', 'Rewa', 'Rewa', 'Madhya Pradesh'),
    ('INDB', 'Indore Junction', 'Indore', 'Madhya Pradesh'),
    ('STA', 'Satna Junction', 'Satna', 'Madhya Pradesh'),
    ('BDTS', 'Bandra Terminus', 'Mumbai', 'Maharashtra'),
    ('PNVL', 'Panvel', 'Navi Mumbai', 'Maharashtra'),
    ('KYN', 'Kalyan Junction', 'Kalyan', 'Maharashtra'),
    ('NK', 'Nashik Road', 'Nashik', 'Maharashtra'),
    ('MMR', 'Manmad Junction', 'Nashik', 'Maharashtra'),
    ('AWB', 'Aurangabad', 'Aurangabad', 'Maharashtra'),
    ('DD', 'Daund Junction', 'Pune', 'Maharashtra'),
    ('SUR', 'Solapur', 'Solapur', 'Maharashtra'),
    ('KOP', 'Kolhapur', 'Kolhapur', 'Maharashtra'),
    ('MAQ', 'Mangaluru Central', 'Mangaluru', 'Karnataka'),
    ('MAJN', 'Mangaluru Junction', 'Mangaluru', 'Karnataka'),
    ('UPN', 'Udupi', 'Udupi', 'Karnataka'),
    ('SWV', 'Sawantwadi Road', 'Sindhudurg', 'Maharashtra'),
]

TRAINS = [
    # (number, name, type, source_code, dest_code)
    ('12951', 'Mumbai Rajdhani Express', 'Rajdhani', 'NDLS', 'BCT'),
    ('12952', 'New Delhi Rajdhani Express', 'Rajdhani', 'BCT', 'NDLS'),
    ('12301', 'Howrah Rajdhani Express', 'Rajdhani', 'NDLS', 'HWH'),
    ('12302', 'New Delhi Rajdhani Express', 'Rajdhani', 'HWH', 'NDLS'),
    ('12259', 'Sealdah Duronto Express', 'Superfast', 'NDLS', 'SDAH'),
    ('12621', 'Tamil Nadu Express', 'Superfast', 'NDLS', 'MAS'),
    ('12622', 'Tamil Nadu Express', 'Superfast', 'MAS', 'NDLS'),
    ('12001', 'New Delhi Bhopal Shatabdi', 'Shatabdi', 'NDLS', 'BPL'),
    ('12002', 'Bhopal New Delhi Shatabdi', 'Shatabdi', 'BPL', 'NDLS'),
    ('22435', 'Vande Bharat Express', 'Vande Bharat', 'NDLS', 'BSB'),
    ('22436', 'Vande Bharat Express', 'Vande Bharat', 'BSB', 'NDLS'),
    ('12627', 'Karnataka Express', 'Superfast', 'SBC', 'NDLS'),
    ('12628', 'Karnataka Express', 'Superfast', 'NDLS', 'SBC'),
    ('12137', 'Punjab Mail', 'Express', 'CSMT', 'NDLS'),
    ('12138', 'Punjab Mail', 'Express', 'NDLS', 'CSMT'),
    ('12025', 'Pune Shatabdi Express', 'Shatabdi', 'PUNE', 'NDLS'),
    ('12026', 'New Delhi Shatabdi Express', 'Shatabdi', 'NDLS', 'PUNE'),
    ('12213', 'Mysuru Duronto Express', 'Superfast', 'MYS', 'NDLS'),
    ('12721', 'Dakshin Express', 'Superfast', 'HYB', 'NDLS'),
    ('12722', 'Dakshin Express', 'Superfast', 'NDLS', 'HYB'),
    ('12841', 'Coromandel Express', 'Superfast', 'HWH', 'MAS'),
    ('12842', 'Coromandel Express', 'Superfast', 'MAS', 'HWH'),
    ('12809', 'Mumbai Mail', 'Express', 'HWH', 'CSMT'),
    ('12810', 'Howrah Mail', 'Express', 'CSMT', 'HWH'),
    ('12429', 'Lucknow Mail', 'Express', 'NDLS', 'LKO'),
    ('12430', 'New Delhi Mail', 'Express', 'LKO', 'NDLS'),
    ('12391', 'Shramjeevi Express', 'Superfast', 'PNBE', 'NDLS'),
    ('12392', 'Shramjeevi Express', 'Superfast', 'NDLS', 'PNBE'),
    ('12489', 'Bikaner Express', 'Express', 'NDLS', 'BKN'),  
]

CLASS_CONFIGS = {
    'Rajdhani':    [('1A',4500),('2A',3200),('3A',2200)],
    'Shatabdi':    [('EC',2500),('CC',1200)],
    'Vande Bharat':[('EC',2000),('CC',950)],
    'Superfast':   [('2A',2800),('3A',1800),('SL',750),('2S',250)],
    'Express':     [('2A',2500),('3A',1600),('SL',600),('GEN',150)],
}

TRAIN_CLASSES = [
    ('1A','First Class AC'), ('2A','AC 2-Tier'), ('3A','AC 3-Tier'),
    ('SL','Sleeper'), ('CC','AC Chair Car'), ('EC','Executive Chair Car'),
    ('2S','Second Sitting'), ('GEN','General/Unreserved'),
]

def seed():
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not set in .env"); return

    url = DATABASE_URL
    if 'sslmode=' not in url:
        url += ('&' if '?' in url else '?') + 'sslmode=require'

    conn = psycopg2.connect(url)
    conn.autocommit = False
    cur = conn.cursor()

    try:
        # ── Clear everything ──
        print("Truncating all tables for a fresh start...")
        cur.execute("""
            TRUNCATE audit_logs, refunds, passengers, payments, bookings, 
                     train_instances, train_seat_configurations, train_schedules, 
                     train_classes, trains, stations CASCADE;
        """)

        # ── 1. Stations ──
        print("Inserting stations...")
        # Deduplicate by code
        seen = set()
        unique_stations = []
        for s in STATIONS:
            if s[0] not in seen:
                seen.add(s[0])
                unique_stations.append(s)
        cur.executemany(
            "INSERT INTO stations (station_code, station_name, city, state) VALUES (%s,%s,%s,%s)",
            unique_stations
        )
        print(f"  Inserted {len(unique_stations)} stations.")

        # Station code -> ID map
        cur.execute("SELECT station_id, station_code FROM stations")
        s_map = {code: sid for sid, code in cur.fetchall()}

        # ── 2. Train Classes ──
        print("Inserting train classes...")
        cur.executemany(
            "INSERT INTO train_classes (class_code, class_name) VALUES (%s,%s)",
            TRAIN_CLASSES
        )
        cur.execute("SELECT class_id, class_code FROM train_classes")
        c_map = {code: cid for cid, code in cur.fetchall()}

        # ── 3. Trains ──
        print("Inserting trains...")
        valid_trains = [
            (num, name, typ, s_map[src], s_map[dst])
            for num, name, typ, src, dst in TRAINS
            if src in s_map and dst in s_map
        ]
        cur.executemany(
            "INSERT INTO trains (train_number, train_name, train_type, source_station_id, destination_station_id) VALUES (%s,%s,%s,%s,%s)",
            valid_trains
        )
        print(f"  Inserted {len(valid_trains)} trains.")

        # ── 4. Seat Configs ──
        cur.execute("SELECT train_id, train_type FROM trains")
        all_trains = cur.fetchall()
        configs = []
        for tid, ttype in all_trains:
            for cls_code, fare in CLASS_CONFIGS.get(ttype, CLASS_CONFIGS['Express']):
                if cls_code in c_map:
                    seats = 20 if cls_code == '1A' else (60 if cls_code in ['2A','EC'] else (400 if cls_code in ['SL','GEN'] else 180))
                    configs.append((tid, c_map[cls_code], seats, fare))
        cur.executemany(
            "INSERT INTO train_seat_configurations (train_id, class_id, total_seats, base_fare) VALUES (%s,%s,%s,%s)",
            configs
        )

        # ── 5. Train Instances (90 days) ──
        import datetime
        today = datetime.date.today()
        instances = []
        tids = [r[0] for r in all_trains]
        for i in range(90):
            d = today + datetime.timedelta(days=i)
            for tid in tids:
                instances.append((tid, d, 'ON_TIME'))
        cur.executemany(
            "INSERT INTO train_instances (train_id, journey_date, status) VALUES (%s,%s,%s)",
            instances
        )
        print(f"  Inserted {len(instances)} train instances (90 days).")

        # ── 6. Train Schedules (Source & Destination minimum) ──
        print("Inserting train schedules...")
        schedules = []
        cur.execute("SELECT train_id, source_station_id, destination_station_id FROM trains")
        for tid, src_id, dst_id in cur.fetchall():
            schedules.append((tid, src_id, 1, '10:00:00', '10:15:00', 1, 0))
            schedules.append((tid, dst_id, 2, '22:00:00', '22:15:00', 1, 1400))
        cur.executemany(
            "INSERT INTO train_schedules (train_id, station_id, stop_sequence, arrival_time, departure_time, day_count, distance_from_source) VALUES (%s,%s,%s,%s,%s,%s,%s)",
            schedules
        )

        # ── 7. Admin user ──
        import bcrypt
        admin_pass = bcrypt.hashpw(b"admin123", bcrypt.gensalt()).decode()
        cur.execute("SELECT user_id FROM users WHERE username='admin'")
        if cur.fetchone():
            cur.execute("UPDATE users SET role='admin', password_hash=%s, account_status='ACTIVE' WHERE username='admin'", (admin_pass,))
            print("Admin user reset to 'admin123'.")
        else:
            cur.execute(
                "INSERT INTO users (username, password_hash, email, role, account_status) VALUES ('admin',%s,'admin@aerorail.com','admin','ACTIVE')",
                (admin_pass,)
            )
            print("Admin user created with 'admin123'.")

        conn.commit()
        print("SUCCESS: Seeding completed successfully!")
    except Exception as e:
        conn.rollback()
        print(f"ERROR: {e}")
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    seed()
