"""
FILE: services/ticket_service.py
CONTENT: PDF Ticket Generation Service
EXPLANATION: This service handles the creation of professional PDF tickets using 
             the ReportLab library. It maps database booking records into a visual layout.
USE: Called by 'routes/booking.py' to generate downloadable e-tickets.
"""

import os
from datetime import datetime

import qrcode
from fpdf import FPDF


class TicketService:
    """
    PDF GENERATOR CLASS
    Explanation: Contains static methods for building ticket documents and generating PNRs.
    """


def _text(value, fallback=''):
    if value in (None, ''):
        value = fallback
    return str(value).encode('latin-1', 'replace').decode('latin-1')


def _money(value):
    try:
        return f"Rs. {float(value):.2f}"
    except (TypeError, ValueError):
        return "Rs. 0.00"


class TicketPDF(FPDF):
    def header(self):
        self.set_fill_color(20, 60, 115)
        self.rect(0, 0, 210, 22, 'F')
        self.set_text_color(255, 255, 255)
        self.set_font('Helvetica', 'B', 15)
        self.set_xy(10, 5)
        self.cell(120, 8, 'IRCTC STYLE E-TICKET - DEMO', 0, 0, 'L')
        self.set_font('Helvetica', 'B', 9)
        self.set_xy(130, 5)
        self.multi_cell(70, 4, 'AeroRail Railway Reservation System\nNOT VALID FOR TRAVEL', 0, 'R')
        self.ln(12)

    def footer(self):
        self.set_y(-16)
        self.set_font('Helvetica', 'I', 7)
        self.set_text_color(90, 90, 90)
        generated_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.cell(0, 6, f'Generated on {generated_at} | Demo ticket only | Not issued by IRCTC', 0, 0, 'C')

    def watermark(self):
        self.set_text_color(235, 190, 190)
        self.set_font('Helvetica', 'B', 34)
        try:
            with self.rotation(35, 105, 150):
                self.text(28, 150, 'NOT REAL TICKET')
        except AttributeError:
            self.set_xy(22, 140)
            self.cell(166, 16, 'NOT REAL TICKET', 0, 0, 'C')
        self.set_text_color(0, 0, 0)


def _section_title(pdf, title):
    pdf.set_fill_color(230, 236, 246)
    pdf.set_text_color(20, 60, 115)
    pdf.set_font('Helvetica', 'B', 10)
    pdf.cell(0, 7, title, 1, 1, 'L', True)
    pdf.set_text_color(0, 0, 0)


def _label_value(pdf, label, value, width=95):
    pdf.set_font('Helvetica', 'B', 8)
    pdf.cell(31, 6, label, 1, 0, 'L')
    pdf.set_font('Helvetica', '', 8)
    pdf.cell(width - 31, 6, _text(value, 'N/A'), 1, 0, 'L')


def generate_ticket_pdf(booking_data, passengers, output_path):
    pdf = TicketPDF()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()
    pdf.watermark()

    pnr = _text(booking_data.get('pnr'), 'N/A')
    status = _text(booking_data.get('status'), 'N/A')
    train_number = _text(booking_data.get('train_number'), 'N/A')
    train_name = _text(booking_data.get('train_name'), 'N/A')
    from_station = _text(booking_data.get('from_station'), 'N/A')
    from_code = _text(booking_data.get('from_code'), '')
    to_station = _text(booking_data.get('to_station'), 'N/A')
    to_code = _text(booking_data.get('to_code'), '')

    pdf.set_draw_color(120, 135, 160)
    pdf.set_line_width(0.2)

    pdf.set_font('Helvetica', 'B', 13)
    pdf.set_fill_color(248, 250, 252)
    pdf.cell(95, 10, f'PNR: {pnr}', 1, 0, 'L', True)
    pdf.cell(0, 10, f'Booking Status: {status}', 1, 1, 'R', True)
    pdf.ln(3)

    _section_title(pdf, 'Journey and Train Details')
    _label_value(pdf, 'Train No./Name', f'{train_number} / {train_name}', 120)
    _label_value(pdf, 'Class', _passenger_classes(passengers), 70)
    pdf.ln()
    _label_value(pdf, 'From', f'{from_station} ({from_code})' if from_code else from_station, 95)
    _label_value(pdf, 'To', f'{to_station} ({to_code})' if to_code else to_station, 95)
    pdf.ln()
    _label_value(pdf, 'Date of Start', booking_data.get('date_of_start') or booking_data.get('departure_date'), 95)
    _label_value(pdf, 'Date of Arrival', booking_data.get('date_of_arrival') or booking_data.get('arrival_date'), 95)
    pdf.ln()
    _label_value(pdf, 'Departure', booking_data.get('departure_time'), 95)
    _label_value(pdf, 'Arrival', booking_data.get('arrival_time'), 95)
    pdf.ln()
    _label_value(pdf, 'Duration', booking_data.get('duration'), 95)
    _label_value(pdf, 'Quota', 'GN', 95)
    pdf.ln(10)

    _section_title(pdf, 'Passenger Details')
    pdf.set_font('Helvetica', 'B', 8)
    pdf.set_fill_color(245, 247, 250)
    widths = [10, 46, 18, 22, 30, 25, 19, 20]
    headers = ['SNo', 'Name', 'Age', 'Gender', 'Current Status', 'Class', 'Coach', 'Seat']
    for width, header in zip(widths, headers):
        pdf.cell(width, 8, header, 1, 0, 'C', True)
    pdf.ln()

    pdf.set_font('Helvetica', '', 8)
    for index, passenger in enumerate(passengers, start=1):
        name = f"{passenger.get('first_name', '')} {passenger.get('last_name', '')}".strip()
        row = [
            index,
            name or 'Passenger',
            passenger.get('age', 'N/A'),
            passenger.get('gender', 'N/A'),
            passenger.get('status', 'N/A'),
            passenger.get('class_code', 'N/A'),
            passenger.get('coach_number') or 'N/A',
            passenger.get('seat_number') or passenger.get('waiting_list_number') or 'N/A',
        ]
        aligns = ['C', 'L', 'C', 'C', 'C', 'C', 'C', 'C']
        for width, value, align in zip(widths, row, aligns):
            pdf.cell(width, 8, _text(value), 1, 0, align)
        pdf.ln()

    pdf.ln(8)
    pdf.set_font('Helvetica', 'B', 10)
    pdf.cell(95, 8, f'Total Fare: {_money(booking_data.get("total_fare"))}', 1, 0, 'L')
    pdf.cell(0, 8, 'Payment: Demo / Not Collected by IRCTC', 1, 1, 'R')
    pdf.ln(6)

    qr_data = (
        f"PNR:{pnr}|TRAIN:{train_number}|FROM:{from_code}|TO:{to_code}|"
        f"START:{booking_data.get('date_of_start') or booking_data.get('departure_date')}|DEMO:NOT_REAL_TICKET"
    )
    qr = qrcode.make(qr_data)
    qr_path = output_path.replace('.pdf', '_qr.png')
    qr.save(qr_path)

    try:
        y = pdf.get_y()
        pdf.image(qr_path, x=10, y=y, w=30)
        pdf.set_xy(46, y)
        pdf.set_font('Helvetica', '', 8)
        pdf.multi_cell(
            150,
            5,
            'This document is formatted to resemble a railway e-ticket for project demonstration only. '
            'It is not an official IRCTC ticket, railway authority document, boarding pass, or travel permit.',
            0,
            'L',
        )
        pdf.output(output_path)
    finally:
        if os.path.exists(qr_path):
            os.remove(qr_path)

    return output_path


def _passenger_classes(passengers):
    classes = sorted({_text(passenger.get('class_code'), 'N/A') for passenger in passengers})
    return ', '.join(classes) if classes else 'N/A'
