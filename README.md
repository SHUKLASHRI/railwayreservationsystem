# 🚆 AeroRail — Smart Railway Reservation System

AeroRail is a modern, premium Single-Page Application (SPA) designed to revolutionize the train booking experience. It features real-time live tracking, a unified booking engine, and support for over 22 Indian languages.

---

## 📖 About AeroRail
AeroRail is built with a mission to simplify transit for over 20 million daily Indian Railway passengers. By combining high-fidelity UI aesthetics with a robust backend architecture, it provides a "flight-like" experience for railway traveling. The platform focuses on accessibility, real-time data transparency, and secure transaction flows.

---

## ⚡ Key Features
- **Live Train Tracking**: Real-time position tracking via the official RailRadar API.
- **Smart Booking Engine**: Automated seat allocation with intelligent waitlisting logic.
- **PNR Management**: Real-time status tracking and dynamic PDF ticket generation with QR codes.
- **Multilingual Support**: High-fidelity i18n support for 22+ local Indian languages.
- **Unified Dashboard**: Centralized management for bookings, profiles, and history.

---

## 🛡️ Security & Ethical Compliance
AeroRail is designed with a "Security-First" mindset, ensuring compliance with official terms and data integrity:
- **Zero-Scraper Policy**: All unauthorized web-scraping logic (e.g., BeautifulSoup/lxml) has been removed to comply with IRCTC Terms of Service and legal standards.
- **Official API Integration**: Exclusively utilizes the RailRadar API for real-time train telemetry.
- **Domain Restriction**: Prevents unauthorized registration from government/official domains (`.gov.in`, `.nic.in`) to ensure platform identity integrity.
- **Data Hardening**: Industry-standard Bcrypt hashing for password security and strictly enforced environment-variable-only secrets.

---

## 🏗️ Technical Architecture
The project follows a **Modular Layered Architecture**:
1.  **Frontend**: Vanilla JavaScript SPA (ES6+), Premium CSS (Glassmorphism), and HTML5.
2.  **Backend**: Python Flask REST API with centralized configuration.
3.  **Database**: Hybrid storage using Supabase (PostgreSQL) for production and SQLite for development.
4.  **DevOps**: Optimized for Vercel Serverless with edge-served static assets.

---

## ⚙️ Production Hardening
- **Secure Sessions**: Enforced `SESSION_COOKIE_SECURE` and `HttpOnly` flags for production HTTPS.
- **Rate Limiting**: Implemented `Flask-Limiter` to prevent brute-force and DDoS attempts.
- **Dependency Locking**: Pin-locked all production dependencies in `requirements.txt` for long-term stability.
- **Performance**: Optimized Vercel routing to bypass the Python runtime for static assets, reducing latency.

---

## 👨‍💻 Installation & Setup

1. **Clone the repository**.
2. **Setup Environment Variables**:
   ```env
   FLASK_SECRET_KEY=your_secret_key
   DATABASE_URL=your_supabase_url
   RAILRADAR_API_KEY=your_api_key
   ```
3. **Install Dependencies**: `pip install -r requirements.txt`
4. **Run Locally**: `python app.py`

---

© 2026 AeroRail. Built with passion for Indian Railways.