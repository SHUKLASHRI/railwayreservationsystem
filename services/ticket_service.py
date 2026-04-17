import os
from fpdf import FPDF
import qrcode
from datetime import datetime

class TicketPDF(FPDF):
    def header(self):
        # Logo placeholder or brand name
        self.set_font('Helvetica', 'B', 20)
        self.set_text_color(26, 35, 126) # Deep Blue
        self.cell(0, 10, 'AeroRail E-Ticket', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.cell(0, 10, f'Generated on {datetime.now().strftime("%Y-%m-%d %H:%M:%S")} | AeroRail — India\'s Smartest Train Platform', 0, 0, 'C')

def generate_ticket_pdf(booking_data, passengers, output_path):
    pdf = TicketPDF()
    pdf.add_page()
    
    # 1. PNR and Booking Status
    pdf.set_font('Helvetica', 'B', 14)
    pdf.cell(100, 10, f'PNR: {booking_data["pnr"]}', 1, 0)
    pdf.cell(0, 10, f'Status: {booking_data["status"]}', 1, 1, 'R')
    pdf.ln(5)

    # 2. Train Details
    pdf.set_font('Helvetica', 'B', 12)
    pdf.cell(0, 10, 'Train Information', 0, 1)
    pdf.set_font('Helvetica', '', 11)
    pdf.cell(90, 8, f'Train: {booking_data["train_name"]} ({booking_data["train_number"]})', 0, 0)
    pdf.cell(0, 8, f'Date: {booking_data["journey_date"]}', 0, 1)
    pdf.cell(90, 8, f'From: {booking_data["from_station"]}', 0, 0)
    pdf.cell(0, 8, f'To: {booking_data["to_station"]}', 0, 1)
    pdf.ln(5)

    # 3. Passenger Details Table
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_fill_color(240, 240, 240)
    pdf.cell(60, 10, 'Name', 1, 0, 'C', True)
    pdf.cell(20, 10, 'Age', 1, 0, 'C', True)
    pdf.cell(20, 10, 'Gender', 1, 0, 'C', True)
    pdf.cell(30, 10, 'Class', 1, 0, 'C', True)
    pdf.cell(30, 10, 'Coach', 1, 0, 'C', True)
    pdf.cell(0, 10, 'Seat', 1, 1, 'C', True)

    pdf.set_font('Helvetica', '', 10)
    for p in passengers:
        pdf.cell(60, 10, f'{p["first_name"]} {p["last_name"]}', 1)
        pdf.cell(20, 10, str(p["age"]), 1, 0, 'C')
        pdf.cell(20, 10, p["gender"], 1, 0, 'C')
        pdf.cell(30, 10, p["class_code"], 1, 0, 'C')
        pdf.cell(30, 10, p["coach_number"] or 'N/A', 1, 0, 'C')
        pdf.cell(0, 10, str(p["seat_number"] or 'N/A'), 1, 1, 'C')
    
    pdf.ln(10)

    # 4. Total Fare
    pdf.set_font('Helvetica', 'B', 12)
    pdf.cell(0, 10, f'Total Fare: Rs. {booking_data["total_fare"]}', 0, 1, 'R')

    # 5. QR Code
    qr_data = f'PNR:{booking_data["pnr"]}|TRAIN:{booking_data["train_number"]}|DATE:{booking_data["journey_date"]}'
    qr = qrcode.make(qr_data)
    
    qr_path = output_path.replace('.pdf', '_qr.png')
    qr.save(qr_path)
    
    pdf.image(qr_path, x=10, y=pdf.get_y(), w=30)
    
    # Clean up QR image
    pdf.output(output_path)
    if os.path.exists(qr_path):
        os.remove(qr_path)
    
    return output_path
