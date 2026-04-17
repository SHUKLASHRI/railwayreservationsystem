# Railway Reservation System

This project is a prototype railway reservation system built using Python and Tkinter.

## Features Planned

1. UI/UX using Tkinter
2. Priority based seat allocation
3. OTP verification system
4. User management
5. Train and schedule management
6. Seat and berth allocation system
7. Payment simulation
8. Ticket generation with PNR
9. Cancellation and refund system
10. Waiting list system
11. MySQL database backend
12. Admin dashboard
13. Error handling and security

## System Architecture

The system follows a modular design:

UI Layer
Logic Layer
Database Layer

### Priority System

Seat allocation follows priority order:

PWD > Elderly Women > Elderly Men > Women > Children > Adult Men

Higher priority passengers receive lower berths.

## Tech Stack

Python  
Tkinter  
MySQL  
bcrypt  
pyotp  

## Current Progress

- Project structure created
- Database schema designed
- Database connection module implemented
- Priority allocation logic implemented
- Initial Tkinter login UI created

## Next Steps

- Implement registration and OTP verification
- Train search module
- Seat allocation engine
- Waiting list system