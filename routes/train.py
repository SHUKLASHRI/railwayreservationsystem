"""
FILE: routes/train.py
CONTENT: Train Search, Details, and Live Tracking Endpoints
EXPLANATION: This module handles all train-related business logic, including searching for 
             stations, finding trains between stations, and fetching real-time tracking data 
             from external APIs.
USE: Provides the backend endpoints for the tracking and home views.
"""

import sqlite3
from flask import Blueprint, request, jsonify
from extensions import execute_query, get_connection, cache, limiter
from services.railradar_service import RailRadarService
import random
import json
from datetime import datetime, timedelta
from decimal import Decimal

# Initialize the Blueprint (modular route group)
train_bp = Blueprint('train', __name__)

# ==============================================================================
# INTERNAL UTILITIES
# ==============================================================================

def _format_time(value, fallback='--:--'):
    """Helper to ensure time strings are consistently formatted."""
    if value is None:
        return fallback
    text = str(value)
    return text[:5] if len(text) >= 5 else text

def _minutes(value):
    """Converts 'HH:MM' string to total minutes from midnight for math comparison."""
    text = _format_time(value, '')
    try:
        hours, minutes = text.split(':')[:2]
        return int(hours) * 60 + int(minutes)
    except (TypeError, ValueError):
        return None

def _date_from_journey(journey_date, day_count=1):
    """Calculates the actual arrival/departure date based on the journey start date and the day offset."""
    if hasattr(journey_date, 'strftime') and not isinstance(journey_date, str):
        base_date = journey_date
    else:
        base_date = datetime.strptime(str(journey_date)[:10], '%Y-%m-%d').date()
    return base_date + timedelta(days=max(int(day_count or 1) - 1, 0))

def _duration_label(departure_date, departure_time, arrival_date, arrival_time):
    """Calculates human-readable travel duration (e.g., '5h 30m')."""
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
    """Helper to convert database-specific types (Decimal, DateTime) into JSON-serializable formats."""
    if isinstance(value, Decimal):
        return float(value)
    if hasattr(value, 'isoformat'):
        return value.isoformat()
    return value

# ==============================================================================
# API ROUTES
# ==============================================================================

@train_bp.route('/stations/search', methods=['GET'])
@limiter.limit("20 per minute")
def search_stations():
    """
    STATION AUTOCOMPLETE
    Explanation: Searches for stations by name or code to provide suggestions in the UI.
    Use: GET /api/train/stations/search?q=Delhi
    """
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])
    
    # Priority 1: Search the local PostgreSQL/SQLite database
    conn = get_connection()
    try:
        if isinstance(conn, sqlite3.Connection):
            # SQLite Syntax
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
            # PostgreSQL Syntax
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

    # No more scraper fallback for legal compliance
    return jsonify([])

@train_bp.route('/search_by_name', methods=['GET'])
@limiter.limit("20 per minute")
def search_by_name():
    """
    TRAIN SEARCH BY NUMBER/NAME
    Explanation: Quickly finds trains based on partial number or name match.
    """
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
@limiter.limit("5 per minute")
def search_trains():
    """
    TRAIN SEARCH ENGINE
    Explanation: Finds all train instances running between a source and destination on a specific date.
    Use: Performs a complex join between trains, instances, and schedules.
    """
    source_code = request.args.get('source_code')
    dest_code = request.args.get('dest_code')
    date = request.args.get('date')
    source_id = request.args.get('source_id')
    dest_id = request.args.get('dest_id')
    
    # Resolve Station IDs to Codes if needed
    if source_id:
        if str(source_id).isdigit():
            s = execute_query("SELECT station_code FROM stations WHERE station_id = %s", (source_id,), fetchone=True)
            if s: source_code = dict(s).get('station_code')
        else: source_code = source_id
    
    if dest_id:
        if str(dest_id).isdigit():
            d = execute_query("SELECT station_code FROM stations WHERE station_id = %s", (dest_id,), fetchone=True)
            if d: dest_code = dict(d).get('station_code')
        else: dest_code = dest_id

    if not source_code or not dest_code or not date:
        return jsonify({"status": "error", "message": "Missing input"}), 400

    # Complex Query: Joins train_instances with schedules to verify route connectivity
    local_trains = execute_query("""
        SELECT DISTINCT i.instance_id, t.train_id, t.train_number, t.train_name, t.train_type,
               s_src.station_name AS source_name, s_dst.station_name AS dest_name,
               ts_src.departure_time, ts_dst.arrival_time,
               ts_src.day_count AS source_day_count, ts_dst.day_count AS dest_day_count,
               i.journey_date, i.status
        FROM train_instances i
        JOIN trains t ON i.train_id = t.train_id
        JOIN train_schedules ts_src ON ts_src.train_id = t.train_id
        JOIN stations s_src ON s_src.station_id = ts_src.station_id 
            AND (s_src.station_code = %s OR LOWER(s_src.station_name) LIKE LOWER(%s))
        JOIN train_schedules ts_dst ON ts_dst.train_id = t.train_id AND ts_dst.stop_sequence > ts_src.stop_sequence
        JOIN stations s_dst ON s_dst.station_id = ts_dst.station_id 
            AND (s_dst.station_code = %s OR LOWER(s_dst.station_name) LIKE LOWER(%s))
        WHERE i.journey_date = %s
    """, (source_code, f"%{source_code}%", dest_code, f"%{dest_code}%", date), fetchall=True)

    if local_trains:
        formatted_results = []
        for lt in local_trains:
            classes = execute_query("""
                SELECT c.class_id, c.class_code, c.class_name, s.total_seats, s.base_fare
                FROM train_seat_configurations s
                JOIN train_classes c ON s.class_id = c.class_id
                WHERE s.train_id = %s
            """, (lt['train_id'],), fetchall=True)
            
            data = {k: _json_ready(v) for k, v in dict(lt).items()}
            data['departure_time'] = _format_time(data['departure_time'])
            data['arrival_time'] = _format_time(data['arrival_time'])
            data['classes'] = [dict(c) for c in classes]
            formatted_results.append(data)
        
        return jsonify({"status": "success", "trains": formatted_results})

    return jsonify({"status": "success", "trains": [], "message": "No trains found"})

@train_bp.route('/<train_number>/details', methods=['GET'])
@cache.cached(timeout=7200)
def get_train_details(train_number):
    """
    TRAIN ROUTE DETAILS
    Explanation: Returns the full sequence of stops for a specific train.
    """
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
    """
    REAL-TIME TRACKING ENGINE
    Explanation: The "Star" feature of the app. Fetches real-world train tracking 
                 from the RailRadar API, with a local cache for performance.
    Use: Called by the frontend Tracking view.
    """
    # LEVEL 1: Check existing cache (valid for 5 mins)
    cached = execute_query("SELECT live_data FROM scraped_live_status WHERE train_number = %s", (train_number,), fetchone=True)
    if cached:
        return jsonify({"status": "success", "data": json.loads(cached['live_data']), "source": "cache"})

    # LEVEL 2: Call the official RailRadar API
    rail_data = RailRadarService.get_live_status(train_number)
    
    if rail_data and rail_data.get('success'):
        data_root = rail_data.get('data', {})
        train_meta = data_root.get('train', {})
        live_data = data_root.get('liveData', {}) or {}
        curr_loc = live_data.get('currentLocation', {})
        
        # Mapping API data for UI consumption
        status_msg = "Running on Time"
        delay = live_data.get('overallDelayMinutes')
        if delay and str(delay).isdigit() and int(delay) > 0:
            status_msg = f"Running {delay}m Late"
        elif curr_loc.get('status') == 'AT_STATION':
            status_msg = f"At {curr_loc.get('stationCode', 'Station')}"
        
        # Format the stops list
        schedule = data_root.get('route', [])
        live_route = live_data.get('route', []) or []
        live_map = {stop.get('stationCode'): stop for stop in live_route if stop.get('stationCode')}
        
        stops = []
        for s in schedule:
            if not s.get('isHalt') and s.get('sequence') != 1: continue
            code = s.get('stationCode')
            live_stop = live_map.get(code, {})
            
            # Map time (handle Unix Timestamps vs Minutes)
            arr_ts = live_stop.get('actualArrival') or s.get('scheduledArrival')
            arr_time = "--:--"
            try:
                if isinstance(arr_ts, (int, float)) and int(arr_ts) > 1000000000:
                    arr_time = datetime.fromtimestamp(int(arr_ts)).strftime('%H:%M')
                elif isinstance(arr_ts, (int, float)):
                    h, m = divmod(int(arr_ts), 60)
                    arr_time = f"{h%24:02d}:{m:02d}"
            except: pass

            stops.append({
                "stationName": s.get('stationName') or code,
                "stationCode": code,
                "hasArrived": live_stop.get('actualArrival') is not None,
                "arrivalTime": arr_time,
                "platform": live_stop.get('platform') or "N/A"
            })

        t_name = train_meta.get('trainName') or f"Train {train_number}"
        formatted = {"trainName": t_name, "statusMessage": status_msg, "stops": stops}
        
        # Cache Result
        execute_query("INSERT INTO scraped_live_status (train_number, live_data) VALUES (%s, %s) ON CONFLICT (train_number) DO UPDATE SET live_data = EXCLUDED.live_data", (train_number, json.dumps(formatted)), commit=True)
        
        return jsonify({"status": "success", "data": formatted, "source": "railradar"})

    return jsonify({"status": "error", "message": "Tracking unavailable"}), 404



