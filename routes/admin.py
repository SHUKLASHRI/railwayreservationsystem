from flask import Blueprint, request, jsonify, session
from database.db_connection import execute_query
from functools import wraps
import json

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role') != 'admin':
            return jsonify({"status": "error", "message": "Admin access required"}), 403
        return f(*args, **kwargs)
    return decorated_function

# ── DASHBOARD STATS ──
@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    user_count = execute_query("SELECT COUNT(*) as count FROM users", fetchone=True)['count']
    train_count = execute_query("SELECT COUNT(*) as count FROM trains", fetchone=True)['count']
    booking_count = execute_query("SELECT COUNT(*) as count FROM bookings", fetchone=True)['count']
    total_revenue = execute_query("SELECT SUM(amount) as total FROM payments WHERE status = 'SUCCESS'", fetchone=True)['total'] or 0
    
    return jsonify({
        "status": "success",
        "stats": {
            "users": user_count,
            "trains": train_count,
            "bookings": booking_count,
            "revenue": float(total_revenue)
        }
    })

# ── USER MANAGEMENT ──
@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    users = execute_query("SELECT user_id, username, email, role, account_status, created_at FROM users ORDER BY created_at DESC", fetchall=True)
    return jsonify([dict(u) for u in users])

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    data = request.get_json()
    role = data.get('role')
    status = data.get('account_status')
    
    execute_query("UPDATE users SET role = %s, account_status = %s WHERE user_id = %s", (role, status, user_id), commit=True)
    return jsonify({"status": "success", "message": "User updated"})

# ── TRAIN MANAGEMENT ──
@admin_bp.route('/trains', methods=['GET'])
@admin_required
def get_trains():
    trains = execute_query("""
        SELECT t.*, s1.station_name as source_name, s2.station_name as dest_name 
        FROM trains t
        JOIN stations s1 ON t.source_station_id = s1.station_id
        JOIN stations s2 ON t.destination_station_id = s2.station_id
        ORDER BY t.train_number
    """, fetchall=True)
    return jsonify([dict(t) for t in trains])

@admin_bp.route('/bookings', methods=['GET'])
@admin_required
def get_bookings():
    bookings = execute_query("""
        SELECT b.*, u.username, t.train_name, t.train_number, ti.journey_date
        FROM bookings b
        JOIN users u ON b.user_id = u.user_id
        JOIN train_instances ti ON b.instance_id = ti.instance_id
        JOIN trains t ON ti.train_id = t.train_id
        ORDER BY b.booking_time DESC
    """, fetchall=True)
    return jsonify([dict(b) for b in bookings])

@admin_bp.route('/trains', methods=['POST'])
@admin_required
def create_train():
    data = request.get_json()
    try:
        execute_query("""
            INSERT INTO trains (train_number, train_name, train_type, source_station_id, destination_station_id)
            VALUES (%s, %s, %s, %s, %s)
        """, (data['train_number'], data['train_name'], data['train_type'], data['source_station_id'], data['destination_station_id']), commit=True)
        return jsonify({"status": "success", "message": "Train created"}), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@admin_bp.route('/trains/<int:train_id>', methods=['PUT', 'DELETE'])
@admin_required
def manage_train(train_id):
    if request.method == 'DELETE':
        execute_query("DELETE FROM trains WHERE train_id = %s", (train_id,), commit=True)
        return jsonify({"status": "success", "message": "Train deleted"})
    
    data = request.get_json()
    execute_query("""
        UPDATE trains SET train_number = %s, train_name = %s, train_type = %s, 
        source_station_id = %s, destination_station_id = %s WHERE train_id = %s
    """, (data['train_number'], data['train_name'], data['train_type'], 
          data['source_station_id'], data['destination_station_id'], train_id), commit=True)
    return jsonify({"status": "success", "message": "Train updated"})

# ── STATION MANAGEMENT ──
@admin_bp.route('/stations', methods=['GET'])
@admin_required
def get_stations():
    stations = execute_query("SELECT * FROM stations ORDER BY station_name", fetchall=True)
    return jsonify([dict(s) for s in stations])

@admin_bp.route('/stations', methods=['POST'])
@admin_required
def create_station():
    data = request.get_json()
    try:
        execute_query("""
            INSERT INTO stations (station_code, station_name, city, state)
            VALUES (%s, %s, %s, %s)
        """, (data['station_code'], data['station_name'], data['city'], data['state']), commit=True)
        return jsonify({"status": "success", "message": "Station created"}), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@admin_bp.route('/stations/<int:station_id>', methods=['PUT', 'DELETE'])
@admin_required
def manage_station(station_id):
    if request.method == 'DELETE':
        execute_query("DELETE FROM stations WHERE station_id = %s", (station_id,), commit=True)
        return jsonify({"status": "success", "message": "Station deleted"})
    
    data = request.get_json()
    execute_query("""
        UPDATE stations SET station_code = %s, station_name = %s, city = %s, state = %s 
        WHERE station_id = %s
    """, (data['station_code'], data['station_name'], data['city'], data['state'], station_id), commit=True)
    return jsonify({"status": "success", "message": "Station updated"})

# ── FINANCIALS (PAYMENTS & REFUNDS) ──
@admin_bp.route('/payments', methods=['GET'])
@admin_required
def get_payments():
    payments = execute_query("""
        SELECT p.*, b.pnr, u.username 
        FROM payments p
        JOIN bookings b ON p.booking_id = b.booking_id
        JOIN users u ON b.user_id = u.user_id
        ORDER BY p.payment_time DESC
    """, fetchall=True)
    return jsonify([dict(p) for p in payments])

@admin_bp.route('/refunds', methods=['GET'])
@admin_required
def get_refunds():
    refunds = execute_query("""
        SELECT r.*, p.transaction_id, b.pnr 
        FROM refunds r
        JOIN payments p ON r.payment_id = p.payment_id
        JOIN bookings b ON r.booking_id = b.booking_id
        ORDER BY r.created_at DESC
    """, fetchall=True)
    return jsonify([dict(r) for r in refunds])

@admin_bp.route('/refunds/process/<int:refund_id>', methods=['POST'])
@admin_required
def process_refund(refund_id):
    execute_query("UPDATE refunds SET status = 'PROCESSED', processed_at = CURRENT_TIMESTAMP WHERE refund_id = %s", (refund_id,), commit=True)
    # Also update payment status
    refund = execute_query("SELECT payment_id FROM refunds WHERE refund_id = %s", (refund_id,), fetchone=True)
    if refund:
        execute_query("UPDATE payments SET status = 'REFUNDED' WHERE payment_id = %s", (refund['payment_id'],), commit=True)
    return jsonify({"status": "success", "message": "Refund processed"})

# ── AUDIT LOGS ──
@admin_bp.route('/logs', methods=['GET'])
@admin_required
def get_logs():
    logs = execute_query("""
        SELECT l.*, u.username 
        FROM audit_logs l
        LEFT JOIN users u ON l.user_id = u.user_id
        ORDER BY l.created_at DESC LIMIT 100
    """, fetchall=True)
    return jsonify([dict(l) for l in logs])

# ── LIVE STATUS MONITOR ──
@admin_bp.route('/live-status', methods=['GET'])
@admin_required
def get_live_status_logs():
    data = execute_query("SELECT * FROM scraped_live_status ORDER BY updated_at DESC", fetchall=True)
    return jsonify([dict(d) for d in data])

# ── PASSENGER MANAGEMENT ──
@admin_bp.route('/passengers', methods=['GET'])
@admin_required
def get_passengers():
    passengers = execute_query("""
        SELECT p.*, b.pnr, c.class_code 
        FROM passengers p
        JOIN bookings b ON p.booking_id = b.booking_id
        JOIN train_classes c ON p.class_id = c.class_id
        ORDER BY p.passenger_id DESC
    """, fetchall=True)
    return jsonify([dict(p) for p in passengers])

# ── TRAIN INSTANCE & CLASS MANAGEMENT ──
@admin_bp.route('/train-instances', methods=['GET'])
@admin_required
def get_train_instances():
    data = execute_query("""
        SELECT i.*, t.train_name, t.train_number 
        FROM train_instances i
        JOIN trains t ON i.train_id = t.train_id
        ORDER BY i.journey_date DESC
    """, fetchall=True)
    return jsonify([dict(d) for d in data])

@admin_bp.route('/train-classes', methods=['GET'])
@admin_required
def get_train_classes():
    data = execute_query("SELECT * FROM train_classes", fetchall=True)
    return jsonify([dict(d) for d in data])

@admin_bp.route('/seat-configs', methods=['GET'])
@admin_required
def get_seat_configs():
    data = execute_query("""
        SELECT sc.*, t.train_name, t.train_number, tc.class_name, tc.class_code
        FROM train_seat_configurations sc
        JOIN trains t ON sc.train_id = t.train_id
        JOIN train_classes tc ON sc.class_id = tc.class_id
        ORDER BY t.train_number
    """, fetchall=True)
    return jsonify([dict(d) for d in data])

@admin_bp.route('/seat-configs', methods=['POST'])
@admin_required
def save_seat_config():
    data = request.get_json()
    try:
        # Check if exists (bulk save pattern)
        execute_query("""
            INSERT INTO train_seat_configurations (train_id, class_id, total_seats, base_fare)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (train_id, class_id) 
            DO UPDATE SET total_seats = EXCLUDED.total_seats, base_fare = EXCLUDED.base_fare
        """, (data['train_id'], data['class_id'], data['total_seats'], data['base_fare']), commit=True)
        return jsonify({"status": "success", "message": "Config saved"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@admin_bp.route('/train-instances', methods=['POST'])
@admin_required
def create_train_instance():
    data = request.get_json()
    try:
        execute_query("""
            INSERT INTO train_instances (train_id, journey_date, status)
            VALUES (%s, %s, %s)
        """, (data['train_id'], data['journey_date'], data.get('status', 'ON_TIME')), commit=True)
        return jsonify({"status": "success", "message": "Instance created"})
    except Exception as e:
        return jsonify({"status": "error", "message": "Duplicate date or database error"}), 400

@admin_bp.route('/train-instances/<int:instance_id>', methods=['PUT', 'DELETE'])
@admin_required
def manage_train_instance(instance_id):
    if request.method == 'DELETE':
        execute_query("DELETE FROM train_instances WHERE instance_id = %s", (instance_id,), commit=True)
        return jsonify({"status": "success", "message": "Instance deleted"})
    
    data = request.get_json()
    execute_query("UPDATE train_instances SET status = %s WHERE instance_id = %s", (data['status'], instance_id), commit=True)
    return jsonify({"status": "success", "message": "Instance updated"})
