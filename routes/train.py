from flask import Blueprint, request, jsonify
from database.db_connection import execute_query
from services.railradar_service import RailRadarService
from app import cache, limiter
import random

train_bp = Blueprint('train', __name__)

@train_bp.route('/stations/search', methods=['GET'])
@cache.cached(timeout=3600, query_string=True) # Cache station searches for 1 hour
@limiter.limit("20 per minute")
def search_stations():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])
    
    # Priority 1: Real-time API
    stations = RailRadarService.search_stations(query)
    if stations:
        return jsonify([
            {
                "station_id": s.get('code'),
                "station_code": s.get('code'),
                "station_name": s.get('name'),
                "city": s.get('name')
            } for s in stations
        ])

    # Fallback: Local Database
    results = execute_query(
        "SELECT station_id, station_code, station_name, city FROM stations WHERE station_code LIKE %s OR station_name LIKE %s LIMIT 10",
        (f"%{query}%", f"%{query}%"),
        fetchall=True
    )
    return jsonify([dict(r) for r in results])

@train_bp.route('/search', methods=['GET'])
@limiter.limit("5 per minute") # Stricter limit for heavy search
def search_trains():
    source_code = request.args.get('source_code')
    dest_code = request.args.get('dest_code')
    date = request.args.get('date')
    source_id = request.args.get('source_id')
    dest_id = request.args.get('dest_id')
    
    if source_id and not source_code:
        s = execute_query("SELECT station_code FROM stations WHERE station_id = %s", (source_id,), fetchone=True)
        if s: source_code = s['station_code']
    
    if dest_id and not dest_code:
        d = execute_query("SELECT station_code FROM stations WHERE station_id = %s", (dest_id,), fetchone=True)
        if d: dest_code = d['station_code']

    if not source_code or not dest_code or not date:
        return jsonify({"status": "error", "message": "Missing search parameters"}), 400

    api_trains = RailRadarService.get_trains_between(source_code, dest_code, date)
    
    formatted_results = []
    if api_trains:
        for t in api_trains:
            train_data = {
                "instance_id": f"LIVE_{t.get('trainNumber')}_{date}",
                "train_id": t.get('trainNumber'),
                "train_number": t.get('trainNumber'),
                "train_name": t.get('trainName'),
                "train_type": "Express",
                "source_name": t.get('sourceStationCode'),
                "dest_name": t.get('destinationStationCode'),
                "journey_date": date,
                "status": "RUNNING",
                "classes": [
                    {"class_code": "3A", "class_name": "AC 3 Tier", "total_seats": 180, "base_fare": 1250, "available_seats": random.randint(10, 50)},
                    {"class_code": "2A", "class_name": "AC 2 Tier", "total_seats": 60, "base_fare": 1800, "available_seats": random.randint(2, 15)},
                    {"class_code": "SL", "class_name": "Sleeper", "total_seats": 400, "base_fare": 550, "available_seats": random.randint(0, 5)}
                ]
            }
            formatted_results.append(train_data)
        
        return jsonify({"status": "success", "trains": formatted_results})

    return jsonify({"status": "success", "trains": [], "message": "No live trains found."})

@train_bp.route('/<train_number>/details', methods=['GET'])
@cache.cached(timeout=7200) # Cache schedules for 2 hours
@limiter.limit("10 per minute")
def get_train_details(train_number):
    schedule = RailRadarService.get_train_schedule(train_number)
    if schedule:
        return jsonify({
            "status": "success",
            "train": {"train_number": train_number, "train_name": schedule.get("trainName")},
            "schedule": schedule.get("stops", [])
        })

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
@limiter.limit("5 per minute") # Live status is volatile, very short cache or no cache
def get_live_tracking(train_number):
    status = RailRadarService.get_live_status(train_number)
    if not status:
        return jsonify({"status": "error", "message": "Live status currently unavailable for this train"}), 404
    
    return jsonify({"status": "success", "data": status})
