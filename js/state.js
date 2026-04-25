/**
 * FILE: js/state.js
 * CONTENT: Global State & Internationalization (i18n) Engine
 * EXPLANATION: This file maintains the 'single source of truth' for the frontend.
 *              It stores the logged-in user, search results, and handles 
 *              multi-language state management.
 */

import { languageOverrides } from './translations.js';

/* SUPPORTED LANGUAGES LIST */
export const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'as', name: 'অসমীয়া' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'brx', name: 'बड़ो' },
    { code: 'doi', name: 'डोगरी' },
    { code: 'gu', name: 'ગુજરાતી' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'kn', name: 'ಕನ್ನಡ' },
    { code: 'ks', name: 'کٲشُر' },
    { code: 'kok', name: 'कोंकणी' },
    { code: 'mai', name: 'मैथिली' },
    { code: 'ml', name: 'മലയാളം' },
    { code: 'mni', name: 'মৈতৈলোন্' },
    { code: 'mr', name: 'मराठी' },
    { code: 'ne', name: 'नेपाली' },
    { code: 'or', name: 'ଓଡ଼ିଆ' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ' },
    { code: 'sa', name: 'संस्कृतम्' },
    { code: 'sat', name: 'ᱥᱟᱱᱛᱟᱲᱤ' },
    { code: 'sd', name: 'سنڌي' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'ur', name: 'اردو' },
];

const en = {
    home: 'Home',
    pnr_status: 'PNR Status',
    live_tracking: 'Live Tracking',
    login: 'Login / Register',
    logout: 'Logout',
    my_account: 'My Account',
    hello: 'Hello',
    book_ticket: 'BOOK TICKET',
    from_station: 'From Station',
    to_station: 'To Station',
    journey_date: 'Journey Date',
    find_trains: 'Find Trains',
    pnr_status_check: 'Check PNR Status',
    pnr_placeholder: 'e.g. 4235678901',
    track_status: 'Track Status',
    search_trains: 'Search Trains',
    passenger_details: 'Passenger Details',
    confirm_pay: 'Confirm & Pay',
    total_amount: 'Total Amount',
    no_trains_found: 'No trains found for this route and date.',
    live_status: 'LIVE STATUS',
    smartest_way: 'The Smartest Way <br/>to Travel by Rail.',
    book_track_pnr: 'Book tickets, track trains in real-time, and get instant updates on PNR status with AeroRail.',
    check_pnr_desc: 'Enter your 10-digit PNR number to get live status.',
    book_now: 'Book Now',
    modify_search: 'Modify Search',
    pnr_status_label: 'PNR Status',
    charts_vacancy: 'Charts / Vacancy',
    train_name_number: 'Train Name / Number',
    boarding_station: 'Boarding Station',
    get_train_chart: 'Get Train Chart',
    enter_city_station: 'Enter City/Station',
    live_train_tracking: 'Live Train Tracking',
    enter_train_number: 'Enter train number to see real-time location and status.',
    track_now: 'Track Now',
    my_bookings: 'My Bookings',
    manage_journeys: 'Manage your upcoming and past journeys.',
    no_bookings: 'No bookings found.',
    ticket_pdf: 'Ticket PDF',
    confirmed: 'CONFIRMED',
    journey_date_label: 'JOURNEY DATE',
    from_label: 'FROM',
    to_label: 'TO',
    download_ticket: 'Download E-Ticket (PDF)',
    please_login_book: 'Please login to book a ticket',
    registration_success: 'Registration successful! Please login.',
    logged_in: 'Logged in successfully',
    login_modal_title: 'Welcome Back',
    login_modal_desc: 'Login to access bookings and profiles.',
    register_modal_title: 'Join AeroRail',
    register_modal_desc: 'Create your account to start booking.',
    username: 'Username',
    password: 'Password',
    dont_have_account: "Don't have an account?",
    register_link: 'Register',
    already_have_account: 'Already have an account?',
    login_link: 'Login',
    language: 'Language',
    create_account: 'Create Account',
    continue: 'Continue'
};

export const i18n = SUPPORTED_LANGUAGES.reduce((packs, language) => {
    packs[language.code] = { ...en, ...(languageOverrides[language.code] || {}) };
    return packs;
}, {});

const savedLanguage = localStorage.getItem('aeroRailLanguage') || 'en';
const supportedCodes = new Set(SUPPORTED_LANGUAGES.map(language => language.code));

export const state = {
    user: null,
    role: 'customer',
    currentPath: window.location.pathname,
    searchResults: [],
    selectedTrain: null,
    isRegistering: false,
    language: supportedCodes.has(savedLanguage) ? savedLanguage : 'en',
    searchDate: new Date().toISOString().split('T')[0]
};

export function t(key) {
    /**
     * TRANSLATION HELPER (t)
     * Explanation: Looks up a translation key in the current language pack.
     *              Falls back to English if the translation is missing.
     */
    return i18n[state.language] && i18n[state.language][key]
        ? i18n[state.language][key]
        : i18n.en[key] || key;
}
