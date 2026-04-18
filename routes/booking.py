from flask import Blueprint, request, jsonify, session, send_file
from database.db_connection import execute_query
from services.ticket_service import generate_ticket_pdf
from services.scraper_service import ScraperService
import random
import string
import os

booking_bp = Blueprint('booking', __name__)

def generate_pnr():
    return ''.join(random.choices(string.digits, k=10))

@booking_bp.route('/book', methods=['POST'])
def book_ticket():
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Login required"}), 401

    data = request.get_json()
    instance_id = data.get('instance_id')
    passengers = data.get('passengers', [])
    total_fare = data.get('total_fare')

    if not instance_id or not passengers:
        return jsonify({"status": "error", "message": "Missing booking details"}), 400

    pnr = generate_pnr()
    user_id = session['user_id']

    try:
        # 1. Create Booking
        booking_id = execute_query(
            "INSERT INTO bookings (user_id, instance_id, pnr, total_fare, status) VALUES (%s, %s, %s, %s, 'CONFIRMED') RETURNING booking_id",
            (user_id, instance_id, pnr, total_fare),
            commit=True, fetchone=True
        )
        
        # Helper for SQLite which doesn't support RETURNING easily in this wrapper
        if not booking_id:
             booking_id = execute_query("SELECT last_insert_rowid() as booking_id", fetchone=True)
        
        b_id = booking_id['booking_id']

        # 2. Add Passengers
        for p in passengers:
            execute_query(
                "INSERT INTO passengers (booking_id, first_name, last_name, age, gender, class_id, status, coach_number, seat_number) VALUES (%s, %s, %s, %s, %s, %s, 'CONFIRMED', %s, %s)",
                (b_id, p['first_name'], p['last_name'], p['age'], p['gender'], p['class_id'], "S"+str(random.randint(1,5)), random.randint(1, 72)),
                commit=True
            )

        return jsonify({"status": "success", "pnr": pnr, "message": "Booking successful"})
    except Exception as e:
        print(f"Booking error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@booking_bp.route('/my-bookings', methods=['GET'])
def my_bookings():
    if 'user_id' not in session:
        return jsonify({"status": "error", "message": "Login required"}), 401
    
    user_id = session['user_id']
    query = """
    SELECT b.*, t.train_name, t.train_number, ti.journey_date
    FROM bookings b
    JOIN train_instances ti ON b.instance_id = ti.instance_id
    JOIN trains t ON ti.train_id = t.train_id
    WHERE b.user_id = %s
    ORDER BY b.booking_time DESC
    """
    bookings = execute_query(query, (user_id,), fetchall=True)
    return jsonify([dict(b) for b in bookings])

@booking_bp.route('/pnr/<pnr>', methods=['GET'])
def get_pnr_status(pnr):
    booking = execute_query(
        """SELECT b.*, t.train_name, t.train_number, ti.journey_date, s1.station_name as from_station, s2.station_name as to_station
           FROM bookings b 
           JOIN train_instances ti ON b.instance_id = ti.instance_id 
           JOIN trains t ON ti.train_id = t.train_id 
           JOIN stations s1 ON t.source_station_id = s1.station_id
           JOIN stations s2 ON t.destination_station_id = s2.station_id
           WHERE b.pnr = %s""", 
        (pnr,), fetchone=True
    )
    if not booking:
        # Fallback: Web Scraper for live PNR not in our system
        scraped_data = ScraperService.scrape_pnr_status(pnr)
        if scraped_data.get("status") == "success":
            return jsonify({
                "status": "success",
                "booking": {
                    "pnr": scraped_data["pnr"],
                    "train_name": scraped_data["train_name"],
                    "from_station": scraped_data["from_station"],
                    "to_station": scraped_data["to_station"],
                    "journey_date": scraped_data["journey_date"]
                },
                "passengers": scraped_data["passengers"],
                "live_scraped": True
            })
        return jsonify({"status": "error", "message": "PNR not found locally or via live tracking"}), 404
    
    passengers = execute_query(
        "SELECT p.*, tc.class_code FROM passengers p JOIN train_classes tc ON p.class_id = tc.class_id WHERE p.booking_id = %s",
        (booking['booking_id'],), fetchall=True
    )
    
    return jsonify({
        "status": "success",
        "booking": dict(booking),
        "passengers": [dict(p) for p in passengers]
    })

@booking_bp.route('/download-ticket/<pnr>', methods=['GET'])
def download_ticket(pnr):
    # Fetch data again for the PDF
    status_resp = get_pnr_status(pnr)
    if status_resp[1] != 200:
        return status_resp
    
    data = status_resp[0].get_json()
    booking = data['booking']
    passengers = data['passengers']
    
    # Use /tmp on Vercel for writable filesystem
    is_vercel = os.getenv('VERCEL') == '1'
    pdf_dir = "/tmp/tickets" if is_vercel else "static/tickets"
    
    os.makedirs(pdf_dir, exist_ok=True)
    pdf_path = f"{pdf_dir}/ticket_{pnr}.pdf"
    
    generate_ticket_pdf(booking, passengers, pdf_path)
    
    return send_file(pdf_path, as_attachment=True)
