# AeroRail — Smart Railway Reservation System

AeroRail is a modern, premium Single-Page Application (SPA) designed to revolutionize the train booking experience. It features real-time live tracking, a unified booking engine, and support for over 22 Indian languages.

---

## 🚀 Features

- **Live Train Tracking**: Real-time position tracking via the RailRadar API.
- **Smart Booking Engine**: Automated seat allocation with intelligent waitlisting (Confirmed/WL).
- **PNR Management**: Track and manage ticket status and download dynamic PDF tickets.
- **Multilingual Support**: Inclusive UI supporting 22+ local Indian languages.
- **User Dashboard**: Centralized view for booking history and profile management.
- **Google Auth Integration**: Secure and seamless sign-in capability.

---

## 🏗️ System Architecture

The project follows a **Modular Layered Architecture**:

1.  **UI Layer (Frontend)**: Built with Vanilla JavaScript, HTML5, and Premium CSS. It functions as a Single-Page Application (SPA) for a "flight-like" smooth experience.
2.  **Logic Layer (Backend)**: Powered by Python Flask, managing API routes, authentication, and service orchestration.
3.  **Database Layer (Storage)**: Uses **Supabase (PostgreSQL)** for production stability, with a smart local **SQLite** fallback for offline development.

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3 (Custom Glassmorphism).
- **Backend**: Python 3.9+, Flask.
- **Database**: PostgreSQL (Supabase), SQLite (Development fallback).
- **APIs**: RailRadar API (Live Status), Google Identity Services (Auth).
- **Security**: Bcrypt (Password hashing), Flask-Limiter (Rate limiting).
- **DevOps**: Vercel (Serverless Deployment).

---

## 📊 Current Progress

- [x] **Core Engine**: Flask backend and SPA router implemented.
- [x] **Database Phase**: Production Supabase integration complete.
- [x] **Live Tracking**: RailRadar API integration functional.
- [x] **Booking Logic**: Confirmed vs Waitlisting engine implemented.
- [x] **Ticket Service**: Dynamic PDF generation with QR codes.
- [x] **Multilingual**: High-fidelity i18n dictionary for 22 languages.

---

## 🛤️ Next Steps (Production Hardening)

- **Payment Gateway**: Integration with real payment providers (Razorpay/Stripe).
- **OTP Verification**: Implementation of mobile/email OTP for security.
- **Mobile App**: Porting the UI to Flutter for native mobile experience.

---

## 👨‍💻 Installation & Setup

1. Clone the repository.
2. Install dependencies: `pip install -r requirements.txt`.
3. Set up `.env` with your Supabase and RailRadar credentials.
4. Run locally: `python app.py`.

---

© 2026 AeroRail. Built with passion for Indian Railways.