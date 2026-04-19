import { state, t } from '../state.js';
import { debounce, showToast, updateNavbarLanguageSelector } from '../utils.js';
import { performSearch, selectClass, startBooking } from '../booking.js';

export function renderHome() {
    const app = document.getElementById('app');
    if (!app) return;
    
    app.innerHTML = `
    <section class="hero-section">
        <div class="hero-background"></div>
        <div class="container hero-content">
            <div class="hero-text">
                <div class="badge-hero">● ${t('live_status')}</div>
                <h1>${t('smartest_way')}</h1>
                <p>${t('book_track_pnr')}</p>
            </div>

            <div class="floating-card soft-card booking-panel">
                <div class="booking-tabs">
                    <div class="tab-underline active" onclick="switchBookingTab(event, 'book')">${t('book_ticket')}</div>
                    <div class="tab-underline" onclick="switchBookingTab(event, 'pnr')">${t('pnr_status_label')}</div>
                    <div class="tab-underline" onclick="switchBookingTab(event, 'charts')">${t('charts_vacancy')}</div>
                </div>

                <!-- BOOK TICKET TAB -->
                <div id="bookTab" class="booking-tab-content active">
                    <h3>${t('book_ticket')}</h3>
                    <div class="booking-form">
                        <div class="form-row">
                            <div class="field-group">
                                <label>${t('from_station')}</label>
                                <div class="input-wrapper">
                                    <input type="text" id="fromInput" class="rounded-input" placeholder="${t('enter_city_station')}" oninput="debouncedStationSearch(this, 'fromSuggestions')"/>
                                    <div id="fromSuggestions" class="suggestions"></div>
                                    <input type="hidden" id="fromId" />
                                </div>
                            </div>
                            <div class="field-group">
                                <label>${t('to_station')}</label>
                                <div class="input-wrapper">
                                    <input type="text" id="toInput" class="rounded-input" placeholder="${t('enter_city_station')}" oninput="debouncedStationSearch(this, 'toSuggestions')"/>
                                    <div id="toSuggestions" class="suggestions"></div>
                                    <input type="hidden" id="toId" />
                                </div>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="field-group">
                                <label>${t('journey_date')}</label>
                                <div class="input-wrapper">
                                    <input type="date" class="rounded-input" id="journeyDate" value="${new Date().toISOString().split('T')[0]}"/>
                                </div>
                            </div>
                            <div class="field-group" style="grid-column: span 2; display: flex; gap: 15px; margin-top: 10px; flex-wrap: wrap;">
                                <label style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 0.8rem; color: var(--text-muted); cursor: pointer;"><input type="checkbox" id="pwdConcession" style="width: 16px; height: 16px;"> Person With Disability Concession</label>
                                <label style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 0.8rem; color: var(--text-muted); cursor: pointer;"><input type="checkbox" id="flexDate" style="width: 16px; height: 16px;"> Flexible With Date</label>
                                <label style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 0.8rem; color: var(--text-muted); cursor: pointer;"><input type="checkbox" id="passConcession" style="width: 16px; height: 16px;"> Railway Pass Concession</label>
                            </div>
                            <div class="field-group" style="grid-column: span 2; margin-top: 10px;">
                                <button class="pill-btn pill-btn-primary" onclick="performSearch()" style="width: 100%;">${t('find_trains')}</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- PNR STATUS TAB -->
                <div id="pnrTab" class="booking-tab-content">
                    <h3>${t('pnr_status_check')}</h3>
                    <p style="color: var(--text-muted); margin-bottom: 16px; font-size: 0.9rem;">${t('check_pnr_desc')}</p>
                    <div class="field-group">
                        <div class="input-wrapper">
                            <input type="text" id="pnrQuery" class="rounded-input" placeholder="${t('pnr_placeholder')}" style="text-align: center; font-size: 1.2rem; letter-spacing: 3px;"/>
                        </div>
                    </div>
                    <button class="pill-btn pill-btn-primary" style="width: 100%; margin-top: 16px;" onclick="checkPNRFromHome()">${t('track_status')}</button>
                </div>

                <!-- CHARTS/VACANCY TAB -->
                <div id="chartsTab" class="booking-tab-content">
                    <h3>${t('charts_vacancy')}</h3>
                    <div class="booking-form">
                        <div class="field-group">
                            <label>${t('train_name_number')}</label>
                            <div class="input-wrapper">
                                <input type="text" class="rounded-input" id="trainNameInput" placeholder="e.g., 12137"/>
                            </div>
                        </div>
                        <div class="field-group">
                            <label>${t('journey_date')}</label>
                            <div class="input-wrapper">
                                <input type="date" class="rounded-input" id="chartsDate"/>
                            </div>
                        </div>
                        <div class="field-group">
                            <label>${t('boarding_station')}</label>
                            <div class="input-wrapper">
                                <select class="rounded-input" id="boardingStation">
                                    <option value="">Select Station</option>
                                </select>
                            </div>
                        </div>
                        <button class="pill-btn pill-btn-primary" style="width: 100%; margin-top: 16px;" onclick="getTrainChart()">${t('get_train_chart')}</button>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="container" style="padding: 60px 0;">
        <div id="searchResults" class="results-section"></div>
    </section>
    `;
    updateNavbarLanguageSelector();
}

export function switchBookingTab(e, tab) {
    if (e) e.preventDefault();
    document.querySelectorAll('.booking-tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-underline').forEach(el => el.classList.remove('active'));

    const tabId = tab === 'book' ? 'bookTab' : tab === 'pnr' ? 'pnrTab' : 'chartsTab';
    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add('active');
    if (e && e.target) e.target.classList.add('active');
}

export const debouncedStationSearch = debounce(handleStationSearch, 300);

export async function handleStationSearch(input, suggestionsId) {
    const q = input.value.trim();
    const box = document.getElementById(suggestionsId);
    if (q.length < 2) { box.classList.remove('open'); return; }

    const resp = await fetch(`/api/train/stations/search?q=${q}`);
    const stations = await resp.json();
    
    box.innerHTML = stations.map(s => `
        <div class="suggestion-item" onclick="selectStation('${suggestionsId}', '${s.station_name}', '${s.station_code}')">
            <strong>${s.station_code}</strong> — ${s.station_name}
        </div>
    `).join('');
    box.classList.add('open');
}

export function selectStation(suggestionsId, name, codeOrId) {
    const inputId = suggestionsId === 'fromSuggestions' ? 'fromInput' : 'toInput';
    const hiddenId = suggestionsId === 'fromSuggestions' ? 'fromId' : 'toId';
    document.getElementById(inputId).value = name;
    document.getElementById(hiddenId).value = codeOrId;
    document.getElementById(suggestionsId).classList.remove('open');
}

export function checkPNRFromHome() {
    const pnr = document.getElementById('pnrQuery').value.trim();
    if (!pnr) {
        showToast('Please enter a PNR number', "error");
        return;
    }
    window.history.pushState({}, '', '/pnr');
    state.currentPath = '/pnr';
    import('./pnr.js').then(m => {
        m.renderPNR();
        setTimeout(() => {
            const pnrInput = document.getElementById('pnrQuery');
            if (pnrInput) {
                pnrInput.value = pnr;
                m.checkPNR();
            }
        }, 100);
    });
}

export function getTrainChart() {
    showToast("Charts/Vacancy feature coming soon!", "info");
}

// Attach to window for HTML onclick handlers
window.switchBookingTab = switchBookingTab;
window.debouncedStationSearch = debouncedStationSearch;
window.selectStation = selectStation;
window.checkPNRFromHome = checkPNRFromHome;
window.getTrainChart = getTrainChart;
window.performSearch = performSearch;
window.selectClass = selectClass;
window.startBooking = startBooking;
