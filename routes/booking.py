"""
FILE: routes/booking.py
CONTENT: Ticket Reservation and PNR Management
EXPLANATION: This module handles the complete lifecycle of a train booking, including
             seat allocation (Confirmed/Waitlisted), PNR generation, and PDF ticket creation.
USE: Provides endpoints for searching, creating, and retrieving user reservations.
"""

import os
import random
import sqlite3
import string
from datetime import datetime, timedelta
from decimal import Decimal

from flask import Blueprint, jsonify, request, send_file, session
from psycopg2.extras import RealDictCursor

from extensions import execute_query, get_connection
from services.ticket_service import generate_ticket_pdf

# Initialize Blueprint for booking-related requests
booking_bp = Blueprint('booking', __name__)

# STATE FLAG (Used to ensure DB schema is synchronized on startup)
_BOOKING_ROUTE_COLUMNS_READY = False

def generate_pnr():
    """
    PNR GENERATOR
    Explanation: Creates a unique 10-digit numeric Passenger Name Record.
    Use: Called during the ticket booking process.
    """
    return ''.join(random.choices(string.digits, k=10))


def _is_sqlite(conn):
    return isinstance(conn, sqlite3.Connection)


def _cursor(conn):
    return conn.cursor() if _is_sqlite(conn) else conn.cursor(cursor_factory=RealDictCursor)


def _query(conn, sql):
    return sql.replace('%s', '?') if _is_sqlite(conn) else sql


def _as_dict(row):
    return dict(row) if row else None


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


def _base_date(journey_date):
    if hasattr(journey_date, 'strftime') and not isinstance(journey_date, str):
        return journey_date
    return datetime.strptime(str(journey_date)[:10], '%Y-%m-%d').date()


def _journey_dates(journey_date, source_day_count, dest_day_count, departure_time, arrival_time):
    source_offset = max(int(source_day_count or 1) - 1, 0)
    dest_offset = max(int(dest_day_count or 1) - 1, 0)
    departure_date = _base_date(journey_date) + timedelta(days=source_offset)
    arrival_date = _base_date(journey_date) + timedelta(days=dest_offset)

    departure_minutes = _minutes(departure_time)
    arrival_minutes = _minutes(arrival_time)
    if (
        dest_offset <= source_offset
        and departure_minutes is not None
        and arrival_minutes is not None
        and arrival_minutes < departure_minutes
    ):
        arrival_date += timedelta(days=1)

    return departure_date, arrival_date


def _duration_label(departure_date, departure_time, arrival_date, arrival_time):
    departure_minutes = _minutes(departure_time)
    arrival_minutes = _minutes(arrival_time)
    if departure_minutes is None or arrival_minutes is None:
        return '--'

    departure_dt = datetime.combine(departure_date, datetime.min.time()) + timedelta(minutes=departure_minutes)
    arrival_dt = datetime.combine(arrival_date, datetime.min.time()) + timedelta(minutes=arrival_minutes)
    if arrival_dt < departure_dt:
        arrival_dt += timedelta(days=1)

    total_minutes = int((arrival_dt - departure_dt).total_seconds() // 60)
    hours, minutes = divmod(total_minutes, 60)
    return f"{hours}h {minutes:02d}m"


def _json_ready(value):
    if isinstance(value, Decimal):
        return float(value)
    if hasattr(value, 'isoformat'):
        return value.isoformat()
    return value


def ensure_booking_route_columns():
    global _BOOKING_ROUTE_COLUMNS_READY
    if _BOOKING_ROUTE_COLUMNS_READY:
        return

    conn = get_connection()
    try:
        cur = conn.cursor()
        if _is_sqlite(conn):
            cur.execute("PRAGMA table_info(bookings)")
            existing = {row[1] for row in cur.fetchall()}
            additions = {
                'source_station_id': 'source_station_id INTEGER',
                'destination_station_id': 'destination_station_id INTEGER',
                'departure_time': 'departure_time TEXT',
                'arrival_time': 'arrival_time TEXT',
                'departure_date': 'departure_date TEXT',
                'arrival_date': 'arrival_date TEXT',
            }
            for column, definition in additions.items():
                if column not in existing:
                    cur.execute(f"ALTER TABLE bookings ADD COLUMN {definition}")
        else:
            for statement in (
                "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source_station_id INTEGER",
                "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS destination_station_id INTEGER",
                "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS departure_time TEXT",
                "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS arrival_time TEXT",
                "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS departure_date TEXT",
                "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS arrival_date TEXT",
            ):
                cur.execute(statement)
        conn.commit()
        _BOOKING_ROUTE_COLUMNS_READY = True
    except Exception as exc:
        conn.rollback()
        print(f"Booking route column check failed: {exc}")
        if os.getenv('VERCEL') == '1':
            raise
    finally:
        conn.close()


def _resolve_station_id(cur, conn, value):
    if value in (None, ''):
        return None
    value_text = str(value).strip()
    if value_text.isdigit():
        return int(value_text)

    cur.execute(
        _query(conn, "SELECT station_id FROM stations WHERE station_code = %s"),
        (value_text.upper(),),
    )
    station = _as_dict(cur.fetchone())
    return station['station_id'] if station else None


def _get_route_schedule(cur, conn, train_id, journey_date, source_station_id, destination_station_id):
    cur.execute(
        _query(
            conn,
            """
            SELECT s_src.station_id AS source_station_id,
                   s_src.station_code AS source_code,
                   s_src.station_name AS from_station,
                   s_dst.station_id AS destination_station_id,
                   s_dst.station_code AS dest_code,
                   s_dst.station_name AS to_station,
                   ts_src.departure_time,
                   ts_dst.arrival_time,
                   ts_src.day_count AS source_day_count,
                   ts_dst.day_count AS dest_day_count
            FROM train_schedules ts_src
            JOIN stations s_src ON s_src.station_id = ts_src.station_id
            JOIN train_schedules ts_dst ON ts_dst.train_id = ts_src.train_id
                AND ts_dst.stop_sequence > ts_src.stop_sequence
            JOIN stations s_dst ON s_dst.station_id = ts_dst.station_id
            WHERE ts_src.train_id = %s
              AND ts_src.station_id = %s
              AND ts_dst.station_id = %s
            LIMIT 1
            """,
        ),
        (train_id, source_station_id, destination_station_id),
    )
    route = _as_dict(cur.fetchone())
    if not route:
        return None

    departure_time = _format_time(route.get('departure_time'))
    arrival_time = _format_time(route.get('arrival_time'))
    departure_date, arrival_date = _journey_dates(
        journey_date,
        route.get('source_day_count'),
        route.get('dest_day_count'),
        departure_time,
        arrival_time,
    )

    route['departure_time'] = departure_time
    route['arrival_time'] = arrival_time
    route['departure_date'] = departure_date.isoformat()
    route['arrival_date'] = arrival_date.isoformat()
    route['duration'] = _duration_label(departure_date, departure_time, arrival_date, arrival_time)
    return route


def _enrich_booking(booking):
    booking = {key: _json_ready(value) for key, value in dict(booking).items()}
    departure_time = _format_time(booking.get('departure_time') or booking.get('schedule_departure_time'))
    arrival_time = _format_time(booking.get('arrival_time') or booking.get('schedule_arrival_time'))

    departure_date = booking.get('departure_date')
    arrival_date = booking.get('arrival_date')
    if not departure_date or not arrival_date:
        computed_departure_date, computed_arrival_date = _journey_dates(
            booking.get('journey_date'),
            booking.get('source_day_count'),
            booking.get('dest_day_count'),
            departure_time,
            arrival_time,
        )
        departure_date = computed_departure_date.isoformat()
        arrival_date = computed_arrival_date.isoformat()

    try:
        dep_date_obj = datetime.strptime(str(departure_date)[:10], '%Y-%m-%d').date()
        arr_date_obj = datetime.strptime(str(arrival_date)[:10], '%Y-%m-%d').date()
        duration = _duration_label(dep_date_obj, departure_time, arr_date_obj, arrival_time)
    except ValueError:
        duration = '--'

    booking['departure_time'] = departure_time
    booking['arrival_time'] = arrival_time
    booking['departure_date'] = str(departure_date)[:10]
    booking['arrival_date'] = str(arrival_date)[:10]
    booking['date_of_start'] = booking['departure_date']
    booking['date_of_arrival'] = booking['arrival_date']
    booking['duration'] = duration
    return booking


def _booking_lookup_query(where_clause):
    return f"""
        SELECT b.*, t.train_name, t.train_number, ti.journey_date,
               bs.station_name AS from_station, bs.station_code AS from_code,
               ds.station_name AS to_station, ds.station_code AS to_code,
               ts_src.departure_time AS schedule_departure_time,
               ts_dst.arrival_time AS schedule_arrival_time,
               ts_src.day_count AS source_day_count,
               ts_dst.day_count AS dest_day_count
        FROM bookings b
        JOIN train_instances ti ON b.instance_id = ti.instance_id
        JOIN trains t ON ti.train_id = t.train_id
        LEFT JOIN stations bs ON bs.station_id = COALESCE(b.source_station_id, t.source_station_id)
        LEFT JOIN stations ds ON ds.station_id = COALESCE(b.destination_station_id, t.destination_station_id)
        LEFT JOIN train_schedules ts_src ON ts_src.train_id = t.train_id
            AND ts_src.station_id = COALESCE(b.source_station_id, t.source_station_id)
        LEFT JOIN train_schedules ts_dst ON ts_dst.train_id = t.train_id
            AND ts_dst.station_id = COALESCE(b.destination_station_id, t.destination_station_id)
        {where_clause}
    """


def _get_booking_payload(pnr):
    ensure_booking_route_columns()
    booking = execute_query(
        _booking_lookup_query("WHERE b.pnr = %s"),
        (pnr,),
        fetchone=True,
    )
    if not booking:
        return None

    passengers = execute_query(
        """
        SELECT p.*, tc.class_code, tc.class_name
        FROM passengers p
        JOIN train_classes tc ON p.class_id = tc.class_id
        WHERE p.booking_id = %s
        ORDER BY p.passenger_id
        """,
        (booking['booking_id'],),
        fetchall=True,
    ) or []

    return {
        "status": "success",
        "booking": _enrich_booking(booking),
        "passengers": [{key: _json_ready(value) for key, value in dict(p).items()} for p in passengers],
        "ticket_available": True,
    }


@booking_bp.route('/book', methods=['POST'])
def book_ticket():
    """
    TICKET RESERVATION ENGINE
    Explanation: This is the most critical function for the reservation system.
                 It validates the route, allocates seats, and handles Waitlisting.
                 To prevent Race Conditions, all operations are wrapped in a 
                 database transaction.
    Use: POST /api/booking/book with instance_id and passenger list.
    """
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Login required"}), 401

    ensure_booking_route_columns()

    data = request.get_json(silent=True) or {}
    instance_id = data.get('instance_id')
    passengers = data.get('passengers', [])
    total_fare = data.get('total_fare')

    if not instance_id or not passengers:
        return jsonify({"status": "error", "message": "Missing booking details"}), 400

    pnr = generate_pnr()
    user_id = session['user_id']
    conn = get_connection()
    cur = _cursor(conn)

    try:
        cur.execute(
            _query(
                conn,
                """
                SELECT ti.instance_id, ti.train_id, ti.journey_date,
                       t.source_station_id, t.destination_station_id
                FROM train_instances ti
                JOIN trains t ON ti.train_id = t.train_id
                WHERE ti.instance_id = %s
                """,
            ),
            (instance_id,),
        )
        train_instance = _as_dict(cur.fetchone())
        if not train_instance:
            return jsonify({"status": "error", "message": "Selected train instance was not found"}), 400

        source_station_id = (
            _resolve_station_id(cur, conn, data.get('source_station_id'))
            or _resolve_station_id(cur, conn, data.get('source_code'))
            or train_instance['source_station_id']
        )
        destination_station_id = (
            _resolve_station_id(cur, conn, data.get('destination_station_id'))
            or _resolve_station_id(cur, conn, data.get('dest_station_id'))
            or _resolve_station_id(cur, conn, data.get('dest_code'))
            or train_instance['destination_station_id']
        )

        route = _get_route_schedule(
            cur,
            conn,
            train_instance['train_id'],
            train_instance['journey_date'],
            source_station_id,
            destination_station_id,
        )
        if not route:
            return jsonify({"status": "error", "message": "Selected route is not valid for this train"}), 400

        booking_params = (
            user_id,
            instance_id,
            pnr,
            total_fare,
            route['source_station_id'],
            route['destination_station_id'],
            route['departure_time'],
            route['arrival_time'],
            route['departure_date'],
            route['arrival_date'],
        )

        if _is_sqlite(conn):
            cur.execute(
                _query(
                    conn,
                    """
                    INSERT INTO bookings (
                        user_id, instance_id, pnr, total_fare, status,
                        source_station_id, destination_station_id,
                        departure_time, arrival_time, departure_date, arrival_date
                    )
                    VALUES (%s, %s, %s, %s, 'CONFIRMED', %s, %s, %s, %s, %s, %s)
                    """,
                ),
                booking_params,
            )
            booking_id = cur.lastrowid
        else:
            cur.execute(
                """
                INSERT INTO bookings (
                    user_id, instance_id, pnr, total_fare, status,
                    source_station_id, destination_station_id,
                    departure_time, arrival_time, departure_date, arrival_date
                )
                VALUES (%s, %s, %s, %s, 'CONFIRMED', %s, %s, %s, %s, %s, %s)
                RETURNING booking_id
                """,
                booking_params,
            )
            booking_id = _as_dict(cur.fetchone())['booking_id']

        for passenger in passengers:
            class_id = passenger.get('class_id')
            cur.execute(_query(conn, "SELECT class_id FROM train_classes WHERE class_id = %s"), (class_id,))
            valid_class = _as_dict(cur.fetchone())
            if not valid_class:
                cur.execute(
                    _query(
                        conn,
                        """
                        SELECT class_id
                        FROM train_classes
                        WHERE class_code IN ('3A', 'SL')
                        ORDER BY CASE WHEN class_code = '3A' THEN 0 ELSE 1 END
                        LIMIT 1
                        """,
                    )
                )
                fallback_class = _as_dict(cur.fetchone())
                if not fallback_class:
                    raise ValueError("No train class is configured for booking")
                class_id = fallback_class['class_id']

            cur.execute(
                _query(
                    conn,
                    "SELECT total_seats FROM train_seat_configurations WHERE train_id = %s AND class_id = %s",
                ),
                (train_instance['train_id'], class_id),
            )
            config = _as_dict(cur.fetchone())
            total_seats = int(config['total_seats']) if config else 50

            cur.execute(
                _query(
                    conn,
                    """
                    SELECT COUNT(*) AS count
                    FROM passengers p_inner
                    JOIN bookings b_inner ON p_inner.booking_id = b_inner.booking_id
                    WHERE b_inner.instance_id = %s AND p_inner.class_id = %s
                    """,
                ),
                (instance_id, class_id),
            )
            booked_count = int(_as_dict(cur.fetchone())['count'])

            first_name = (passenger.get('first_name') or 'Unknown').strip()
            last_name = (passenger.get('last_name') or '').strip()
            age = int(passenger.get('age') or 25)
            gender = passenger.get('gender') or 'Male'

            if booked_count >= total_seats:
                waitlist_number = booked_count - total_seats + 1
                cur.execute(
                    _query(
                        conn,
                        """
                        INSERT INTO passengers (
                            booking_id, first_name, last_name, age, gender, class_id,
                            status, waiting_list_number
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, 'WAITLISTED', %s)
                        """,
                    ),
                    (booking_id, first_name, last_name, age, gender, class_id, waitlist_number),
                )
            else:
                cur.execute(
                    _query(
                        conn,
                        """
                        INSERT INTO passengers (
                            booking_id, first_name, last_name, age, gender, class_id,
                            status, coach_number, seat_number
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, 'CONFIRMED', %s, %s)
                        """,
                    ),
                    (
                        booking_id,
                        first_name,
                        last_name,
                        age,
                        gender,
                        class_id,
                        "S" + str(random.randint(1, 5)),
                        booked_count + 1,
                    ),
                )
            # TRANSACTIONAL SAFETY:
            # In a high-concurrency production system, we would use:
            # 1. SELECT ... FOR UPDATE to lock the seat count.
            # 2. An atomic counter in Redis.
            # 3. DB Constraints to ensure count never exceeds total_seats.
            # For this academic project, we use a single Transaction (commit at end).

        conn.commit()
        return jsonify({"status": "success", "pnr": pnr, "message": "Booking successful"})
    except Exception as exc:
        conn.rollback()
        print(f"Booking error: {exc}")
        return jsonify({"status": "error", "message": str(exc)}), 500
    finally:
        conn.close()


@booking_bp.route('/my-bookings', methods=['GET'])
def my_bookings():
    """
    USER RESERVATION HISTORY
    Explanation: Fetches all bookings made by the currently logged-in user.
    Use: Called by the 'Dashboard' view.
    """
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Login required"}), 401

    ensure_booking_route_columns()
    user_id = session['user_id']
    bookings = execute_query(
        _booking_lookup_query("WHERE b.user_id = %s ORDER BY b.booking_time DESC"),
        (user_id,),
        fetchall=True,
    ) or []
    return jsonify([_enrich_booking(booking) for booking in bookings])


@booking_bp.route('/pnr/<pnr>', methods=['GET'])
def get_pnr_status(pnr):
    """
    PNR STATUS LOOKUP
    Explanation: Retrieves the current status (Confirmed/Waitlisted) and coach details for a PNR.
    Use: GET /api/booking/pnr/<pnr>
    """
    payload = _get_booking_payload(pnr)
    if not payload:
        return jsonify({"status": "error", "message": "PNR not found in your local bookings"}), 404
    return jsonify(payload)


@booking_bp.route('/download-ticket/<pnr>', methods=['GET'])
def download_ticket(pnr):
    """
    E-TICKET GENERATOR
    Explanation: Triggers the TicketService to create a dynamic PDF ticket and serves it for download.
    Use: GET /api/booking/download-ticket/<pnr>
    """
    payload = _get_booking_payload(pnr)
    if not payload:
        return jsonify({"status": "error", "message": "Ticket PDF is available only for real local bookings"}), 404

    is_vercel = os.getenv('VERCEL') == '1'
    pdf_dir = "/tmp/tickets" if is_vercel else "static/tickets"
    os.makedirs(pdf_dir, exist_ok=True)

    pdf_path = os.path.join(pdf_dir, f"ticket_{pnr}.pdf")
    try:
        generate_ticket_pdf(payload['booking'], payload['passengers'], pdf_path)
    except Exception as exc:
        print(f"Ticket PDF error: {exc}")
        return jsonify({"status": "error", "message": "Could not generate ticket PDF"}), 500

    return send_file(pdf_path, as_attachment=True, download_name=f"ticket_{pnr}.pdf")
