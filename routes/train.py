import sqlite3
from flask import Blueprint, request, jsonify
from database.db_connection import execute_query, get_connection
from services.scraper_service import ScraperService
from extensions import cache, limiter
import random
import json
from datetime import datetime, timedelta
from decimal import Decimal

train_bp = Blueprint('train', __name__)


def _format_time(value, fallback='--:--'):
    if value is None:
        return fallback
    text = str(value)
    return text[:5] if len(text) >= 5 else text


def _minutes(value):
    text = _format_time(value, '')
    try:
        hours, minutes = text.split(':')[:2]
        return int(hours) * 60 + int(minutes)
    except (TypeError, ValueError):
        return None


def _date_from_journey(journey_date, day_count=1):
    if hasattr(journey_date, 'strftime') and not isinstance(journey_date, str):
        base_date = journey_date
    else:
        base_date = datetime.strptime(str(journey_date)[:10], '%Y-%m-%d').date()
    return base_date + timedelta(days=max(int(day_count or 1) - 1, 0))


def _duration_label(departure_date, departure_time, arrival_date, arrival_time):
    dep_minutes = _minutes(departure_time)
    arr_minutes = _minutes(arrival_time)
    if dep_minutes is None or arr_minutes is None:
        return '--'

    dep_dt = datetime.combine(departure_date, datetime.min.time()) + timedelta(minutes=dep_minutes)
    arr_dt = datetime.combine(arrival_date, datetime.min.time()) + timedelta(minutes=arr_minutes)
    if arr_dt < dep_dt:
        arr_dt += timedelta(days=1)

    total_minutes = int((arr_dt - dep_dt).total_seconds() // 60)
    hours, minutes = divmod(total_minutes, 60)
    return f"{hours}h {minutes:02d}m"


def _json_ready(value):
    if isinstance(value, Decimal):
        return float(value)
    if hasattr(value, 'isoformat'):
        return value.isoformat()
    return value

@train_bp.route('/stations/search', methods=['GET'])
@limiter.limit("20 per minute")
def search_stations():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])
    
    # Priority 1: Local Database (always prefer real data over scraper mock)
    conn = get_connection()
    try:
        if isinstance(conn, sqlite3.Connection):
            cur = conn.cursor()
            cur.execute(
                """SELECT station_id, station_code, station_name, city FROM stations
                   WHERE station_code LIKE ? COLLATE NOCASE OR station_name LIKE ? COLLATE NOCASE
                   ORDER BY station_name LIMIT 10""",
                (f"{query}%", f"%{query}%"),
            )
            rows = cur.fetchall()
            cols = [d[0] for d in cur.description]
            results = [dict(zip(cols, row)) for row in rows]
        else:
            cur = conn.cursor()
            cur.execute(
                """SELECT station_id, station_code, station_name, city FROM stations
                   WHERE station_code ILIKE %s OR station_name ILIKE %s
                   ORDER BY station_name LIMIT 10""",
                (f"{query}%", f"%{query}%"),
            )
            rows = cur.fetchall()
            cols = [d[0] for d in cur.description]
            results = [dict(zip(cols, row)) for row in rows]
    finally:
        conn.close()

    if results:
        return jsonify(results)

    # Fallback: Web Scraper (returns mock/live data when DB is empty)
    scraped_stations = ScraperService.scrape_station_search(query)
    return jsonify(scraped_stations)

@train_bp.route('/search_by_name', methods=['GET'])
@limiter.limit("20 per minute")
def search_by_name():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify({"status": "success", "trains": []})

    like_query = f"%{query}%"
    trains = execute_query(
        "SELECT train_id, train_number, train_name, train_type FROM trains WHERE train_number LIKE %s OR LOWER(train_name) LIKE LOWER(%s) LIMIT 10",
        (like_query, like_query),
        fetchall=True
    )
    return jsonify({"status": "success", "trains": [dict(t) for t in trains] if trains else []})

@train_bp.route('/search', methods=['GET'])
@limiter.limit("5 per minute") # Stricter limit for heavy search
def search_trains():
    source_code = request.args.get('source_code')
    dest_code = request.args.get('dest_code')
    date = request.args.get('date')
    source_id = request.args.get('source_id')
    dest_id = request.args.get('dest_id')
    
    # Handle cases where source_id might be a code (common in JS frontend)
    if source_id:
        if str(source_id).isdigit():
            s = execute_query("SELECT station_code FROM stations WHERE station_id = %s", (source_id,), fetchone=True)
            if s: source_code = dict(s).get('station_code')
        else:
            source_code = source_id # It's a code already
    
    if dest_id:
        if str(dest_id).isdigit():
            d = execute_query("SELECT station_code FROM stations WHERE station_id = %s", (dest_id,), fetchone=True)
            if d: dest_code = dict(d).get('station_code')
        else:
            dest_code = dest_id # It's a code already

    if not source_code or not dest_code or not date:
        return jsonify({"status": "error", "message": "Invalid station selection or date"}), 400

    # Local DB: any train whose schedule lists source before destination (CSV / full route).
    local_trains = execute_query("""
        SELECT DISTINCT i.instance_id, t.train_id, t.train_number, t.train_name, t.train_type,
               s_src.station_name AS source_name, s_dst.station_name AS dest_name,
               s_src.station_id AS source_station_id, s_dst.station_id AS dest_station_id,
               s_src.station_code AS source_code, s_dst.station_code AS dest_code,
               ts_src.departure_time, ts_dst.arrival_time,
               ts_src.day_count AS source_day_count, ts_dst.day_count AS dest_day_count,
               i.journey_date, i.status
        FROM train_instances i
        JOIN trains t ON i.train_id = t.train_id
        JOIN train_schedules ts_src ON ts_src.train_id = t.train_id
        JOIN stations s_src ON s_src.station_id = ts_src.station_id 
            AND (s_src.station_code = %s OR LOWER(s_src.station_name) LIKE LOWER(%s))
        JOIN train_schedules ts_dst ON ts_dst.train_id = t.train_id
            AND ts_dst.stop_sequence > ts_src.stop_sequence
        JOIN stations s_dst ON s_dst.station_id = ts_dst.station_id 
            AND (s_dst.station_code = %s OR LOWER(s_dst.station_name) LIKE LOWER(%s))
        WHERE i.journey_date = %s
    """, (source_code, f"%{source_code}%", dest_code, f"%{dest_code}%", date), fetchall=True)

    if local_trains:
        formatted_results = []
        for lt in local_trains:
            # Fetch seat configs for this train
            classes = execute_query("""
                SELECT c.class_id, c.class_code, c.class_name, s.total_seats, s.base_fare
                FROM train_seat_configurations s
                JOIN train_classes c ON s.class_id = c.class_id
                WHERE s.train_id = %s
            """, (lt['train_id'],), fetchall=True)
            
            train_data = {key: _json_ready(value) for key, value in dict(lt).items()}
            train_data['journey_date'] = str(lt['journey_date'])

            departure_time = _format_time(train_data.get('departure_time'))
            arrival_time = _format_time(train_data.get('arrival_time'))
            departure_date = _date_from_journey(train_data['journey_date'], train_data.get('source_day_count'))
            arrival_date = _date_from_journey(train_data['journey_date'], train_data.get('dest_day_count'))

            if (
                int(train_data.get('dest_day_count') or 1) <= int(train_data.get('source_day_count') or 1)
                and _minutes(arrival_time) is not None
                and _minutes(departure_time) is not None
                and _minutes(arrival_time) < _minutes(departure_time)
            ):
                arrival_date += timedelta(days=1)

            train_data['departure_time'] = departure_time
            train_data['arrival_time'] = arrival_time
            train_data['departure_date'] = departure_date.isoformat()
            train_data['arrival_date'] = arrival_date.isoformat()
            train_data['duration'] = _duration_label(departure_date, departure_time, arrival_date, arrival_time)
            train_data['dest_station_id'] = train_data.get('dest_station_id')
            train_data['classes'] = [
                {key: _json_ready(value) for key, value in dict(c).items()}
                for c in classes
            ]
            
            # Add randomized availability to make it feel "live"
            for c in train_data['classes']:
                c['available_seats'] = random.randint(0, 50)
                
            formatted_results.append(train_data)
        
        return jsonify({"status": "success", "trains": formatted_results})

    return jsonify({"status": "success", "trains": [], "message": "No trains found for this route and date."})

@train_bp.route('/<train_number>/details', methods=['GET'])
@cache.cached(timeout=7200) # Cache schedules for 2 hours
@limiter.limit("10 per minute")
def get_train_details(train_number):
    # Scraper integration for schedule (not fully implemented in scraper yet, using fallback)
    schedule = None

    train = execute_query("SELECT * FROM trains WHERE train_number = %s", (train_number,), fetchone=True)
    if not train:
        return jsonify({"status": "error", "message": "Train not found"}), 404
    
    local_schedule = execute_query(
        "SELECT ts.*, s.station_name, s.station_code FROM train_schedules ts JOIN stations s ON ts.station_id = s.station_id WHERE ts.train_id = %s ORDER BY ts.stop_sequence",
        (train['train_id'],),
        fetchall=True
    )
    
    return jsonify({
        "status": "success",
        "train": dict(train),
        "schedule": [dict(s) for s in local_schedule]
    })

@train_bp.route('/live/<train_number>', methods=['GET'])
@limiter.limit("5 per minute")
def get_live_tracking(train_number):
    # Enforce table exists for caching scraped live data
    # (Using primitive creation compatible with Supabase and SQLite)
    execute_query(
        "CREATE TABLE IF NOT EXISTS scraped_live_status (train_number TEXT PRIMARY KEY, live_data TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        commit=True
    )
    
    # 1. Supabase/DB Check
    cached_record = execute_query("SELECT live_data, updated_at FROM scraped_live_status WHERE train_number = %s", (train_number,), fetchone=True)
    
    if cached_record:
        # Check freshness (e.g. within 15 minutes)
        # Assuming updated_at string parse based on environment
        # For simplicity, we just return the cached data if it exists, to demonstrate the DB return loop
        status = json.loads(cached_record['live_data'])
        return jsonify({"status": "success", "data": status, "source": "supabase_cache"})

    # 2. Scrape live data
    status = ScraperService.scrape_live_train(train_number)
    
    if status:
        # 3. Clean usable data and trash duplicates (Overwrite cache safely via Parameterized Query)
        json_data = json.dumps(status)
        existing = execute_query("SELECT train_number FROM scraped_live_status WHERE train_number = %s", (train_number,), fetchone=True)
        if existing:
            execute_query("UPDATE scraped_live_status SET live_data = %s, updated_at = CURRENT_TIMESTAMP WHERE train_number = %s", (json_data, train_number), commit=True)
        else:
            execute_query("INSERT INTO scraped_live_status (train_number, live_data) VALUES (%s, %s)", (train_number, json_data), commit=True)
            
        return jsonify({"status": "success", "data": status, "source": "live_scrape"})
        
    return jsonify({"status": "error", "message": "Live status currently unavailable for this train"}), 404
