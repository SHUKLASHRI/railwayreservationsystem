from flask import Blueprint, request, jsonify
from database.db_connection import execute_query

train_bp = Blueprint('train', __name__)

@train_bp.route('/stations/search', methods=['GET'])
def search_stations():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])
    
    # Search by code or name
    results = execute_query(
        "SELECT station_id, station_code, station_name, city FROM stations WHERE station_code LIKE %s OR station_name LIKE %s LIMIT 10",
        (f"%{query}%", f"%{query}%"),
        fetchall=True
    )
    
    return jsonify([dict(r) for r in results])

@train_bp.route('/search', methods=['GET'])
def search_trains():
    source_id = request.args.get('source_id')
    dest_id = request.args.get('dest_id')
    date = request.args.get('date') # Format: YYYY-MM-DD

    if not source_id or not dest_id or not date:
        return jsonify({"status": "error", "message": "Missing search parameters"}), 400

    # Real logic would check if stations are on the same route. 
    # For this simulated app, we'll return trains that go from source to dest or pass through them.
    # Simplified: return all trains for the given date that match source and dest.
    query = """
    SELECT 
        ti.instance_id,
        t.train_id,
        t.train_number,
        t.train_name,
        t.train_type,
        s1.station_name as source_name,
        s2.station_name as dest_name,
        ti.journey_date,
        ti.status
    FROM train_instances ti
    JOIN trains t ON ti.train_id = t.train_id
    JOIN stations s1 ON t.source_station_id = s1.station_id
    JOIN stations s2 ON t.destination_station_id = s2.station_id
    WHERE t.source_station_id = %s AND t.destination_station_id = %s AND ti.journey_date = %s
    """
    results = execute_query(query, (source_id, dest_id, date), fetchall=True)

    formatted_results = []
    for r in results:
        train_data = dict(r)
        # Fetch classes and availability for this train
        classes = execute_query(
            "SELECT tc.class_code, tc.class_name, tsc.total_seats, tsc.base_fare FROM train_seat_configurations tsc JOIN train_classes tc ON tsc.class_id = tc.class_id WHERE tsc.train_id = %s",
            (train_data['train_id'],),
            fetchall=True
        )
        train_data['classes'] = [dict(c) for c in classes]
        # Simulate dynamic availability
        for c in train_data['classes']:
            c['available_seats'] = (c['total_seats'] // 2) + (train_data['instance_id'] * 7) % (c['total_seats'] // 2)
        
        formatted_results.append(train_data)

    return jsonify({"status": "success", "trains": formatted_results})

@train_bp.route('/<int:train_id>/details', methods=['GET'])
def get_train_details(train_id):
    train = execute_query("SELECT * FROM trains WHERE train_id = %s", (train_id,), fetchone=True)
    if not train:
        return jsonify({"status": "error", "message": "Train not found"}), 404
    
    schedule = execute_query(
        "SELECT ts.*, s.station_name, s.station_code FROM train_schedules ts JOIN stations s ON ts.station_id = s.station_id WHERE ts.train_id = %s ORDER BY ts.stop_sequence",
        (train_id,),
        fetchall=True
    )
    
    return jsonify({
        "status": "success",
        "train": dict(train),
        "schedule": [dict(s) for s in schedule]
    })
