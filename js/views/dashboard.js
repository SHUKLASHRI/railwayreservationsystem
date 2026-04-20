/**
 * FILE: js/views/dashboard.js
 * CONTENT: User Profile and Booking History View
 * EXPLANATION: Displays a summary of the user's past and upcoming train reservations.
 *              It allows users to view ticket details and PNR status.
 * USE: Rendered when a logged-in user clicks on 'My Bookings'.
 */

/**
 * FILE: js/views/home.js
 * CONTENT: Landing Page and Search Controller
 * EXPLANATION: The main interface for the AeroRail app. It handles the 'From' 
 *              and 'To' station search, date picker, and results display.
 * USE: Default view of the application.
 */

import { state, t } from '../state.js';
// ...
export async function renderDashboard() {
    /**
     * DASHBOARD RENDERER
     * Explanation: Fetches booking records from /api/booking/my-bookings and 
     *              dynamically creates cards for each ticket.
     */
    if (!state.user) {
        route({preventDefault: () => {}, target: {closest: () => ({pathname: '/'})}});
        return;
    }

    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
        <div class="container" style="padding: 100px 0 80px;">
            <h1 style="color: var(--primary);">${t('my_bookings')}</h1>
            <p style="color: var(--text-muted); margin-bottom: 40px;">${t('manage_journeys')}</p>
            <div id="bookingHistory" class="results-section">
                <div class="skeleton" style="height: 100px; margin-bottom: 20px;"></div>
                <div class="skeleton" style="height: 100px;"></div>
            </div>
        </div>
    `;

    try {
        const resp = await fetch('/api/booking/my-bookings');
        const data = await resp.json();
        const historyDiv = document.getElementById('bookingHistory');
        if (!historyDiv) return;

        if (!Array.isArray(data) || data.length === 0) {
            historyDiv.innerHTML = `<p>${t('no_bookings')}</p>`;
            return;
        }

        historyDiv.innerHTML = data.map(b => `
            <div class="soft-card" style="padding: 24px; display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap;">
                <div>
                    <span class="train-type">${b.status || 'UNKNOWN'}</span>
                    <div style="font-size: 1.2rem; font-weight: 800; margin: 8px 0; color: var(--primary);">${b.train_name || 'Train'}</div>
                    <div style="color: var(--text-muted); font-size: 0.9rem;">#${b.train_number || 'N/A'} | ${b.from_station || 'From'} to ${b.to_station || 'To'}</div>
                    <div style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">
                        Start: ${b.date_of_start || b.departure_date || b.journey_date || 'N/A'} ${b.departure_time || ''}
                        | Arrival: ${b.date_of_arrival || b.arrival_date || b.journey_date || 'N/A'} ${b.arrival_time || ''}
                    </div>
                    <div style="margin-top: 10px; font-weight: 700; color: var(--accent);">PNR: ${b.pnr}</div>
                </div>
                <div>
                    <a href="/booking-confirmed/${b.pnr}" onclick="route(event)" class="pill-btn" style="background: var(--primary); color: white; text-decoration: none;">View Details</a>
                </div>
            </div>
        `).join('');
    } catch (e) {
        const historyDiv = document.getElementById('bookingHistory');
        if (historyDiv) {
            historyDiv.innerHTML = '<p style="color: var(--danger);">Could not load bookings right now.</p>';
        }
        console.error('Dashboard error:', e);
    }
}
