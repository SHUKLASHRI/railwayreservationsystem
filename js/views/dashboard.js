import { state, t } from '../state.js';
import { route } from '../router.js';

export async function renderDashboard() {
    if (!state.user) { 
        route({preventDefault:()=>{}, target:{closest:()=>({pathname:'/'})}}); 
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

        if (data.length === 0) {
            historyDiv.innerHTML = `<p>${t('no_bookings')}</p>`;
            return;
        }

        historyDiv.innerHTML = data.map(b => `
            <div class="soft-card" style="padding: 24px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <span class="train-type">${b.status}</span>
                    <div style="font-size: 1.2rem; font-weight: 800; margin: 8px 0; color: var(--primary);">${b.train_name}</div>
                    <div style="color: var(--text-muted); font-size: 0.9rem;">#${b.train_number} · ${t('journey_date_label')}: ${b.journey_date}</div>
                    <div style="margin-top: 10px; font-weight: 700; color: var(--accent);">PNR: ${b.pnr}</div>
                </div>
                <div>
                    <a href="/api/booking/download-ticket/${b.pnr}" class="pill-btn" style="background: var(--primary); color: white; text-decoration: none;">${t('ticket_pdf')}</a>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error("Dashboard error:", e);
    }
}
