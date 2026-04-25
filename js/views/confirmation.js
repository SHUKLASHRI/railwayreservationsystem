/**
 * FILE: js/views/confirmation.js
 * CONTENT: Booking Success View
 * EXPLANATION: Shows the confirmed ticket details immediately after a successful 
 *              reservation. It includes the PNR and a download link.
 * USE: Automatically triggered after a successful /api/booking/book call.
 */

import { t } from '../state.js';
import { money } from '../utils.js';

function detail(label, value) {
    return `
        <div style="padding: 14px 0; border-bottom: 1px solid var(--border-light);">
            <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;">${label}</div>
            <div style="font-size: 1rem; color: var(--primary); font-weight: 800; margin-top: 4px;">${value || 'N/A'}</div>
        </div>
    `;
}

export async function renderBookingConfirmation(pnr) {
    const app = document.getElementById('app');
    if (!app) return;

    if (!pnr) {
        app.innerHTML = `
            <div class="container" style="padding: 120px 0 80px;">
                <div class="soft-card" style="max-width: 760px; margin: 0 auto; padding: 36px; text-align: center;">
                    <h1 style="color: var(--danger); margin-bottom: 12px;">Booking Not Found</h1>
                    <p style="color: var(--text-muted);">No PNR was provided for this confirmation page.</p>
                </div>
            </div>
        `;
        return;
    }

    app.innerHTML = `
        <div class="container" style="padding: 110px 0 80px;">
            <div class="skeleton" style="height: 420px; border-radius: 16px;"></div>
        </div>
    `;

    try {
        const resp = await fetch(`/api/booking/pnr/${encodeURIComponent(pnr)}`);
        const data = await resp.json();

        if (!resp.ok || data.status !== 'success') {
            app.innerHTML = `
                <div class="container" style="padding: 120px 0 80px;">
                    <div class="soft-card" style="max-width: 760px; margin: 0 auto; padding: 36px; text-align: center;">
                        <h1 style="color: var(--danger); margin-bottom: 12px;">Booking Not Found</h1>
                        <p style="color: var(--text-muted);">${data.message || 'Could not load this booking.'}</p>
                    </div>
                </div>
            `;
            return;
        }

        const b = data.booking;
        const passengers = data.passengers || [];
        const startDate = b.date_of_start || b.departure_date || b.journey_date;
        const arrivalDate = b.date_of_arrival || b.arrival_date || b.journey_date;

        app.innerHTML = `
            <div class="container" style="padding: 110px 0 80px;">
                <section class="soft-card" style="padding: 36px; max-width: 980px; margin: 0 auto;">
                    <div style="display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; flex-wrap: wrap; padding-bottom: 28px; border-bottom: 1px solid var(--border-light);">
                        <div>
                            <span class="availability-pill available" style="font-size: 0.8rem;">CONFIRMED</span>
                            <h1 style="color: var(--primary); margin: 14px 0 8px; font-size: 2rem;">Booking Confirmed</h1>
                            <div style="font-size: 1.15rem; color: var(--text-muted); font-weight: 700;">PNR: <span style="color: var(--accent);">${b.pnr}</span></div>
                        </div>
                        <a href="/api/booking/download-ticket/${b.pnr}" class="pill-btn pill-btn-primary" style="text-decoration: none; padding: 16px 28px;">Download Ticket PDF</a>
                    </div>

                    <div style="display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr); gap: 32px; margin-top: 30px;">
                        <div>
                            <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase;">Train Details</div>
                            <h2 style="color: var(--primary); margin: 8px 0 4px;">${b.train_name || 'Train'}</h2>
                            <div style="color: var(--text-muted); font-weight: 700;">#${b.train_number || 'N/A'} | ${b.from_station || 'From'} to ${b.to_station || 'To'}</div>

                            <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 18px; align-items: center; margin: 30px 0; padding: 24px; background: var(--surface-soft, #f8fafc); border-radius: 8px;">
                                <div>
                                    <div style="font-size: 1.8rem; color: var(--primary); font-weight: 900;">${b.departure_time || '--:--'}</div>
                                    <div style="color: var(--text-muted); font-weight: 800; margin-top: 4px;">${startDate || 'N/A'}</div>
                                    <div style="margin-top: 8px; color: var(--text-main); font-weight: 700;">${b.from_station || 'From'}</div>
                                </div>
                                <div style="text-align: center; color: var(--text-muted); font-weight: 800;">
                                    <div style="height: 2px; width: 90px; background: var(--border); margin-bottom: 8px;"></div>
                                    ${b.duration || '--'}
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 1.8rem; color: var(--primary); font-weight: 900;">${b.arrival_time || '--:--'}</div>
                                    <div style="color: var(--text-muted); font-weight: 800; margin-top: 4px;">${arrivalDate || 'N/A'}</div>
                                    <div style="margin-top: 8px; color: var(--text-main); font-weight: 700;">${b.to_station || 'To'}</div>
                                </div>
                            </div>

                            <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase; margin-bottom: 12px;">Passengers</div>
                            <div style="border: 1px solid var(--border-light); border-radius: 8px; overflow: hidden;">
                                ${passengers.map((p, index) => `
                                    <div style="display: grid; grid-template-columns: 44px 1fr auto; gap: 14px; align-items: center; padding: 14px 16px; border-bottom: ${index < passengers.length - 1 ? '1px solid var(--border-light)' : '0'};">
                                        <div style="font-weight: 900; color: var(--text-muted);">${index + 1}</div>
                                        <div>
                                            <div style="font-weight: 900; color: var(--primary);">${p.first_name || ''} ${p.last_name || ''}</div>
                                            <div style="font-size: 0.85rem; color: var(--text-muted);">Age ${p.age || 'N/A'} | ${p.gender || 'N/A'} | ${p.class_code || 'N/A'}</div>
                                        </div>
                                        <div style="text-align: right; font-weight: 900; color: var(--success);">
                                            ${p.status || 'N/A'}<br/>
                                            <span style="font-size: 0.85rem; color: var(--primary);">${p.coach_number || 'WL'}-${p.seat_number || p.waiting_list_number || 'N/A'}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <aside>
                            <div style="border: 1px solid var(--border-light); border-radius: 8px; padding: 22px;">
                                <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase; margin-bottom: 10px;">Ticket Summary</div>
                                ${detail('PNR', b.pnr)}
                                ${detail('Status', b.status || 'CONFIRMED')}
                                ${detail('Date of Start', startDate)}
                                ${detail('Date of Arrival', arrivalDate)}
                                ${detail('Total Fare', money(b.total_fare))}
                                <a href="/api/booking/download-ticket/${b.pnr}" class="pill-btn pill-btn-primary" style="width: 100%; text-decoration: none; margin-top: 20px; padding: 15px;">Download Ticket PDF</a>
                                <a href="/dashboard" onclick="route(event)" class="pill-btn" style="width: 100%; text-decoration: none; margin-top: 12px; background: var(--border-light); color: var(--primary);">View My Bookings</a>
                            </div>
                        </aside>
                    </div>
                </section>
            </div>
        `;
    } catch (err) {
        app.innerHTML = `
            <div class="container" style="padding: 120px 0 80px;">
                <div class="soft-card" style="max-width: 760px; margin: 0 auto; padding: 36px; text-align: center;">
                    <h1 style="color: var(--danger); margin-bottom: 12px;">Could Not Load Booking</h1>
                    <p style="color: var(--text-muted);">Please try opening your booking again from My Bookings.</p>
                </div>
            </div>
        `;
    }
}
