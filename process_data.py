import json
import csv
import re
import random
from collections import defaultdict

# 1. Load Station Dataset
station_codes = {}
stations_by_code = {}
with open('station dataset 1.json', 'r', encoding='utf-8') as f:
    stations = json.load(f)
    for st in stations:
        name = st['station_name'].upper()
        code = st['station_code'].upper()
        station_codes[name] = code
        stations_by_code[code] = name

# Fallback codes
def get_or_create_code(name):
    name = name.strip().upper()
    if name in station_codes:
        return station_codes[name]
    
    # Try fuzzy
    for known_name, code in station_codes.items():
        if name in known_name or known_name in name:
            return code
            
    # Generate new code
    code = ''.join([c for c in name if c.isalpha()])[:4].upper()
    if not code:
        code = 'XX'
    while code in stations_by_code:
        code += str(random.randint(1,9))
    station_codes[name] = code
    stations_by_code[code] = name
    return code

# 2. Parse train_details.csv (The detailed ones)
trains_data = [] # List of dicts for the final CSV
existing_train_nos = set()

with open('database/data/train_details.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        trains_data.append(row)
        existing_train_nos.add(row['Train No'].strip())
        # Make sure stations are in our dictionary
        station_codes[row['Station Name'].strip().upper()] = row['Station Code'].strip().upper()
        stations_by_code[row['Station Code'].strip().upper()] = row['Station Name'].strip().upper()
        station_codes[row['Source Station Name'].strip().upper()] = row['Source Station'].strip().upper()
        stations_by_code[row['Source Station'].strip().upper()] = row['Source Station Name'].strip().upper()
        station_codes[row['Destination Station Name'].strip().upper()] = row['Destination Station'].strip().upper()
        stations_by_code[row['Destination Station'].strip().upper()] = row['Destination Station Name'].strip().upper()

# 3. Parse train dataset 2.txt
# Format: Train No. | From | To | Train Name | Table No.
with open('train dataset 2.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_trains = []
for line in lines:
    line = line.strip()
    if not line or line.startswith('Train') or line.startswith('No.') or line.startswith('TAG'):
        continue
    
    # Example: 11003/11004 Dadar Sawantwadi Road Rajya Rani 26
    # Regex to grab numbers at start
    match = re.match(r'^(\d+)(?:/(\d+))?\s+(.+)$', line)
    if match:
        t1 = match.group(1)
        t2 = match.group(2) # Return train
        rest = match.group(3)
        
        # Remove trailing table numbers
        rest = re.sub(r'\s+[\d,]+$', '', rest).strip()
        
        # Heuristic: First word is Source, next words are Dest + Name. 
        # Actually just make Source = first 2 words, Dest = next 2 words, etc. if possible
        words = rest.split()
        if len(words) >= 3:
            src = words[0]
            if len(words) >= 4 and words[1] in ['CST', 'Nagar', 'Tilak']:
                src += ' ' + words[1]
                dest = words[2]
                name_start = 3
            else:
                dest = words[1]
                name_start = 2
                
            name = ' '.join(words[name_start:]) if name_start < len(words) else 'Express'
            if not name.strip(): name = 'Express'
            
            new_trains.append((t1, name, src, dest))
            if t2:
                new_trains.append((t2, name + ' Return', dest, src))

# For new trains, generate intermediate stops
# Limit to 50 trains to avoid massive SQL file sizes if needed, or do all. We'll do 100 for a good dataset.
random.seed(42)
all_stations_list = list(stations_by_code.keys())

for t_no, t_name, src_name, dest_name in new_trains[:200]:
    if t_no in existing_train_nos:
        continue
        
    src_code = get_or_create_code(src_name)
    dest_code = get_or_create_code(dest_name)
    
    # Add to trains_data
    # Source
    trains_data.append({
        'Train No': t_no, 'Train Name': t_name, 'SEQ': '1', 
        'Station Code': src_code, 'Station Name': stations_by_code[src_code],
        'Arrival time': '', 'Departure Time': '08:00', 'Distance': '0',
        'Source Station': src_code, 'Source Station Name': stations_by_code[src_code],
        'Destination Station': dest_code, 'Destination Station Name': stations_by_code[dest_code]
    })
    
    # 2 random intermediate stops
    stops = random.sample(all_stations_list, 2)
    dist = 100
    time_h = 10
    for i, stop in enumerate(stops):
        trains_data.append({
            'Train No': t_no, 'Train Name': t_name, 'SEQ': str(i+2), 
            'Station Code': stop, 'Station Name': stations_by_code[stop],
            'Arrival time': f'{time_h}:00', 'Departure Time': f'{time_h}:10', 'Distance': str(dist),
            'Source Station': src_code, 'Source Station Name': stations_by_code[src_code],
            'Destination Station': dest_code, 'Destination Station Name': stations_by_code[dest_code]
        })
        dist += 150
        time_h += 3
        
    # Dest
    trains_data.append({
        'Train No': t_no, 'Train Name': t_name, 'SEQ': '4', 
        'Station Code': dest_code, 'Station Name': stations_by_code[dest_code],
        'Arrival time': f'{time_h}:00', 'Departure Time': '', 'Distance': str(dist),
        'Source Station': src_code, 'Source Station Name': stations_by_code[src_code],
        'Destination Station': dest_code, 'Destination Station Name': stations_by_code[dest_code]
    })

# 4. Write combined CSV
fieldnames = ['Train No','Train Name','SEQ','Station Code','Station Name','Arrival time','Departure Time','Distance','Source Station','Source Station Name','Destination Station','Destination Station Name']
with open('database/data/master_train_data.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(trains_data)

# 5. Generate Supabase SQL
# Build stations to insert
stations_to_insert = set()
for row in trains_data:
    stations_to_insert.add((row['Station Code'], row['Station Name']))

# Build trains to insert
trains_to_insert = {}
for row in trains_data:
    t_no = row['Train No']
    if t_no not in trains_to_insert:
        trains_to_insert[t_no] = {
            'name': row['Train Name'],
            'src': row['Source Station'],
            'dest': row['Destination Station']
        }

sql_lines = [
    "-- ==========================================================",
    "-- Generated Supabase Seed File (includes massive dataset)",
    "-- ==========================================================",
    "BEGIN;",
    ""
]

# Write Stations
sql_lines.append("-- 1. Insert Stations")
for code, name in stations_to_insert:
    # escape quotes
    name = name.replace("'", "''")
    sql_lines.append(f"INSERT INTO stations (station_code, station_name) VALUES ('{code}', '{name}') ON CONFLICT (station_code) DO NOTHING;")

# We need station IDs for trains. In raw SQL, we can't easily get the ID back for the next insert if we don't know it.
# So we must use subqueries or CTEs.
# Example: INSERT INTO trains (...) VALUES (..., (SELECT station_id FROM stations WHERE station_code = '...'), ...)
sql_lines.append("\n-- 2. Insert Trains")
for t_no, t_data in trains_to_insert.items():
    name = t_data['name'].replace("'", "''")
    src = t_data['src']
    dest = t_data['dest']
    sql_lines.append(f"""
INSERT INTO trains (train_number, train_name, train_type, source_station_id, destination_station_id) 
VALUES ('{t_no}', '{name}', 'Express', 
    (SELECT station_id FROM stations WHERE station_code = '{src}'), 
    (SELECT station_id FROM stations WHERE station_code = '{dest}')
) ON CONFLICT (train_number) DO NOTHING;""")

sql_lines.append("\n-- 3. Insert Classes & Seat Configs")
sql_lines.append("""
INSERT INTO train_classes (class_code, class_name) VALUES 
('1A', 'First Class AC'), ('2A', 'AC 2-Tier'), ('3A', 'AC 3-Tier'), ('SL', 'Sleeper'), ('CC', 'AC Chair Car') 
ON CONFLICT (class_code) DO NOTHING;
""")

for t_no in trains_to_insert.keys():
    sql_lines.append(f"""
INSERT INTO train_seat_configurations (train_id, class_id, total_seats, base_fare) VALUES 
((SELECT train_id FROM trains WHERE train_number = '{t_no}'), (SELECT class_id FROM train_classes WHERE class_code = '3A'), 200, 1500.00),
((SELECT train_id FROM trains WHERE train_number = '{t_no}'), (SELECT class_id FROM train_classes WHERE class_code = 'SL'), 300, 600.00)
ON CONFLICT DO NOTHING;""")

sql_lines.append("\n-- 4. Insert Schedules")
for row in trains_data:
    t_no = row['Train No']
    seq = row['SEQ']
    st_code = row['Station Code']
    arr = row['Arrival time'] or '00:00:00'
    dep = row['Departure Time'] or '00:00:00'
    if len(arr) == 5: arr += ':00'
    if len(dep) == 5: dep += ':00'
    dist = row['Distance']
    sql_lines.append(f"""
INSERT INTO train_schedules (train_id, station_id, stop_sequence, arrival_time, departure_time, distance_from_source) VALUES 
((SELECT train_id FROM trains WHERE train_number = '{t_no}'), (SELECT station_id FROM stations WHERE station_code = '{st_code}'), {seq}, '{arr}', '{dep}', {dist})
ON CONFLICT DO NOTHING;""")

sql_lines.append("\n-- 5. Insert Train Instances (for searches)")
dates = ['2026-04-20', '2026-04-21', '2026-04-22', '2026-04-23', '2026-04-24']
for t_no in trains_to_insert.keys():
    for d in dates:
        sql_lines.append(f"""
INSERT INTO train_instances (train_id, journey_date, status) VALUES 
((SELECT train_id FROM trains WHERE train_number = '{t_no}'), '{d}', 'ON_TIME')
ON CONFLICT DO NOTHING;""")

sql_lines.append("\nCOMMIT;")

with open('database/seed_supabase.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print("Data processing complete!")
