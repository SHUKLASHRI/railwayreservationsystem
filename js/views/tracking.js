/**
 * FILE: js/views/tracking.js
 * CONTENT: Real-Time Train Status UI
 * EXPLANATION: Renders the tracking dashboard where users can input a train number 
 *              to see its live location, delays, and upcoming stops.
 * USE: Core 'Tracking' page of the app.
 */

/**
 * FILE: js/views/home.js
 * CONTENT: Hero Section and Train Search UI
 * EXPLANATION: Renders the landing page where users can search for trains by source/destination.
 *              It handles the station autocomplete and date selection logic.
 * USE: Main landing page of the application.
 */

import { state, t } from '../state.js';

export function renderTracking() {
    /**
     * TRACKING RENDERER
     * Explanation: Sets up the search input for live tracking.
     */
    const app = document.getElementById('app');
    if (!app) return;
    
    app.innerHTML = `
    <div class="container" style="padding: 100px 0 80px;">
        <div class="soft-card" style="max-width: 800px; margin: 0 auto; padding: 40px;">
            <div style="text-align: center; margin-bottom: 40px;">
                <h2 style="margin-bottom: 10px; color: var(--primary);">${t('live_train_tracking')}</h2>
                <p style="color: var(--text-muted);">${t('enter_train_number')}</p>
            </div>

            <div class="search-grid" style="grid-template-columns: 1fr auto;">
                <div class="field-group">
                    <div class="input-wrapper">
                        <input type="text" id="trackQuery" class="rounded-input" placeholder="e.g. 12137" style="font-size: 1.25rem;"/>
                    </div>
                </div>
                <button class="pill-btn pill-btn-primary" style="padding: 12px 32px;" onclick="checkLiveStatus()">${t('track_now')}</button>
            </div>

            <div id="trackingResult" style="margin-top: 40px;"></div>
        </div>
    </div>
    `;
}

export async function checkLiveStatus() {
    /**
     * LIVE TRACKING LOGIC
     * Explanation: Fetches real-time status from the /api/train/live endpoint and 
     *              dynamically updates the DOM with the results.
     */
    const trainNum = document.getElementById('trackQuery')?.value.trim();
    if (!trainNum) return;

    const resDiv = document.getElementById('trackingResult');
    if (resDiv) resDiv.innerHTML = '<div class="skeleton" style="height: 300px; border-radius: 16px;"></div>';

    try {
        const resp = await fetch(`/api/train/live/${trainNum}`);
        const data = await resp.json();

        if (data.status === 'success' && resDiv) {
            const status = data.data;
            resDiv.innerHTML = `
                <div class="soft-card">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid var(--border-light);">
                        <div>
                            <span class="availability-pill available" style="background: rgba(16, 185, 129, 0.1); color: #047857;">LIVE</span>
                            <h3 style="font-size: 1.5rem; margin-top: 12px; color: var(--primary);">${status.trainName || 'Train Name'}</h3>
                            <div style="color: var(--text-muted); font-weight: 600; margin-top: 4px;">#${trainNum}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 1.25rem; font-weight: 800; color: var(--success);">${status.statusMessage || 'Running on Time'}</div>
                            <div style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">Last updated: ${new Date().toLocaleTimeString()}</div>
                        </div>
                    </div>

                    <div style="position: relative; padding-left: 30px;">
                        ${(status.stops || []).slice(0, 5).map((stop, idx) => `
                            <div style="position: relative; margin-bottom: ${idx < 4 ? '25px' : '0'};">
                                <div style="position: absolute; left: -38px; top: 3px; width: 12px; height: 12px; border-radius: 50%; background: ${stop.hasArrived ? 'var(--success)' : 'var(--border)'}; border: 3px solid white; box-shadow: 0 0 0 2px ${stop.hasArrived ? 'var(--success)' : 'var(--border)'};"></div>
                                <div style="display: flex; justify-content: space-between; ${idx < 4 ? 'padding-bottom: 25px; border-left: 2px solid var(--border-light); padding-left: 12px;' : 'padding-left: 12px;'}">
                                    <div>
                                        <div style="font-weight: 700; color: var(--primary);">${stop.stationName} (${stop.stationCode})</div>
                                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">${stop.hasArrived ? 'Arrived & Departed' : 'Upcoming'}</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-weight: 700; color: var(--primary); font-size: 1.1rem;">${stop.arrivalTime || '--:--'}</div>
                                        <div style="font-size: 0.8rem; color: var(--text-muted);">Platform ${stop.platform || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            if (resDiv) resDiv.innerHTML = `<div class="soft-card" style="text-align: center; padding: 40px;"><p style="color: var(--danger);">${data.message}</p></div>`;
        }
    } catch (e) {
        if (resDiv) resDiv.innerHTML = `<div class="soft-card" style="text-align: center; padding: 40px;"><p style="color: var(--danger);">Error connecting to live tracking service.</p></div>`;
    }
}

// Global exposure
window.checkLiveStatus = checkLiveStatus;
