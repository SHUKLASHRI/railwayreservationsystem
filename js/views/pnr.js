import { t } from '../state.js';

export function renderPNR() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
    <div class="container" style="padding: 100px 0 80px;">
        <div class="soft-card" style="max-width: 600px; margin: 0 auto; padding: 40px; text-align: center;">
            <h2 style="margin-bottom: 10px; color: var(--primary);">${t('pnr_status_check')}</h2>
            <p style="color: var(--text-muted); margin-bottom: 30px;">${t('check_pnr_desc')}</p>
            <div class="field-group" style="margin-bottom: 24px;">
                <div class="input-wrapper">
                    <input type="text" id="pnrQuery" class="rounded-input" placeholder="${t('pnr_placeholder')}" style="text-align: center; font-size: 1.5rem; letter-spacing: 4px;"/>
                </div>
            </div>
            <button class="pill-btn pill-btn-primary" style="width: 100%; padding: 16px;" onclick="checkPNR()">${t('track_status')}</button>
            <div id="pnrResult" style="margin-top: 40px; text-align: left;"></div>
        </div>
    </div>
    `;
}

export async function checkPNR() {
    const pnr = document.getElementById('pnrQuery')?.value.trim();
    if (!pnr) return;

    const resDiv = document.getElementById('pnrResult');
    if (resDiv) resDiv.innerHTML = '<div class="skeleton" style="height: 200px; border-radius: 16px;"></div>';

    try {
        const resp = await fetch(`/api/booking/pnr/${encodeURIComponent(pnr)}`);
        const data = await resp.json();

        if (resp.ok && data.status === 'success' && resDiv) {
            const b = data.booking;
            const ticketLink = data.ticket_available
                ? `<a href="/api/booking/download-ticket/${b.pnr}" class="pill-btn pill-btn-primary" style="width: 100%; text-decoration: none; padding: 16px;">${t('download_ticket')}</a>`
                : '';

            resDiv.innerHTML = `
                <div class="soft-card" style="padding: 28px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 20px; gap: 16px;">
                        <div>
                            <span class="availability-pill available">${b.status || 'UNKNOWN'}</span>
                            <h3 style="font-size: 1.3rem; margin: 12px 0 4px; color: var(--primary);">${b.train_name}</h3>
                            <div style="color: var(--text-muted); font-size: 0.9rem;">#${b.train_number} | PNR: ${b.pnr}</div>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 0.75rem; color: var(--text-muted);">START / ARRIVAL</span>
                            <div style="font-weight: 700; font-size: 1rem; color: var(--primary);">${b.date_of_start || b.departure_date} ${b.departure_time || ''}</div>
                            <div style="font-weight: 700; font-size: 1rem; color: var(--primary);">${b.date_of_arrival || b.arrival_date} ${b.arrival_time || ''}</div>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--border-light);">
                       <div>
                          <small style="color: var(--text-muted); font-weight: 600;">${t('from_label')}</small>
                          <div style="font-weight: 700; font-size: 1.05rem; margin-top: 4px;">${b.from_station}</div>
                       </div>
                       <div>
                          <small style="color: var(--text-muted); font-weight: 600;">${t('to_label')}</small>
                          <div style="font-weight: 700; font-size: 1.05rem; margin-top: 4px;">${b.to_station}</div>
                       </div>
                    </div>
                    <div style="margin-bottom: 24px;">
                        <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 12px; color: var(--text-main);">Passengers</h4>
                       ${data.passengers.map(p => `
                          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-light);">
                            <span>${p.first_name} ${p.last_name}</span>
                            <span style="font-weight: 700; color: var(--primary);">${p.status || ''} ${p.coach_number || ''}-${p.seat_number || p.waiting_list_number || 'N/A'}</span>
                          </div>
                       `).join('')}
                    </div>
                    ${ticketLink}
                </div>
            `;
        } else if (resDiv) {
            resDiv.innerHTML = `<div class="soft-card" style="padding: 24px; text-align: center;"><p style="color: var(--danger);">${data.message || 'PNR not found.'}</p></div>`;
        }
    } catch (err) {
        if (resDiv) resDiv.innerHTML = '<div class="soft-card" style="padding: 24px; text-align: center;"><p style="color: var(--danger);">Error checking PNR. Please try again.</p></div>';
    }
}

window.checkPNR = checkPNR;
