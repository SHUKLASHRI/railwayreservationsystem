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
                                <input type="text" class="rounded-input" id="trainNameInput" placeholder="e.g., 12951" oninput="debouncedTrainSearch(this, 'trainSuggestions')"/>
                                <div id="trainSuggestions" class="suggestions"></div>
                                <input type="hidden" id="trainId" />
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
                                <input type="text" id="boardingInput" class="rounded-input" placeholder="${t('enter_city_station')}" oninput="debouncedStationSearch(this, 'boardingSuggestions')"/>
                                <div id="boardingSuggestions" class="suggestions"></div>
                                <input type="hidden" id="boardingId" />
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
export const debouncedTrainSearch = debounce(handleTrainSearch, 300);

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

export async function handleTrainSearch(input, suggestionsId) {
    const q = input.value.trim();
    const box = document.getElementById(suggestionsId);
    if (q.length < 2) { box.classList.remove('open'); return; }

    const resp = await fetch(`/api/train/search_by_name?q=${q}`);
    const data = await resp.json();
    
    if(data.status === 'success' && data.trains) {
        box.innerHTML = data.trains.map(t => `
            <div class="suggestion-item" onclick="selectTrain('${t.train_number}', '${t.train_name}')">
                <strong>${t.train_number}</strong> — ${t.train_name}
            </div>
        `).join('');
        box.classList.add('open');
    }
}

export function selectTrain(trainNo, trainName) {
    document.getElementById('trainNameInput').value = `${trainNo} - ${trainName}`;
    document.getElementById('trainId').value = trainNo;
    document.getElementById('trainSuggestions').classList.remove('open');
}

export function selectStation(suggestionsId, name, codeOrId) {
    let inputId = 'toInput';
    let hiddenId = 'toId';
    if (suggestionsId === 'fromSuggestions') {
        inputId = 'fromInput';
        hiddenId = 'fromId';
    } else if (suggestionsId === 'boardingSuggestions') {
        inputId = 'boardingInput';
        hiddenId = 'boardingId';
    }
    
    const inputEl = document.getElementById(inputId);
    const hiddenEl = document.getElementById(hiddenId);
    if(inputEl) inputEl.value = name;
    if(hiddenEl) hiddenEl.value = codeOrId;
    
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
    const trainInput = document.getElementById('trainNameInput')?.value || '12951';
    const dateInput = document.getElementById('chartsDate')?.value || new Date().toISOString().split('T')[0];
    
    const resDiv = document.getElementById('searchResults');
    if (!resDiv) return;

    resDiv.innerHTML = `
        <div style="padding: 20px; background: white; border-radius: var(--radius-lg); box-shadow: var(--shadow);">
            <h3 style="color: var(--primary); margin-bottom: 15px;">Train Chart for ${trainInput} on ${dateInput}</h3>
            <p style="color: var(--text-muted); margin-bottom: 20px;">Chart preparation completed. Here is the current vacancy status.</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div style="padding: 15px; border: 1px solid var(--border-light); border-radius: 8px;">
                    <div style="font-weight: bold; font-size: 1.1rem; margin-bottom: 8px;">AC 3-Tier (3A)</div>
                    <div style="color: var(--success); font-weight: 600;">AVAILABLE - 12 Seats</div>
                </div>
                <div style="padding: 15px; border: 1px solid var(--border-light); border-radius: 8px;">
                    <div style="font-weight: bold; font-size: 1.1rem; margin-bottom: 8px;">AC 2-Tier (2A)</div>
                    <div style="color: var(--success); font-weight: 600;">AVAILABLE - 4 Seats</div>
                </div>
                <div style="padding: 15px; border: 1px solid var(--border-light); border-radius: 8px;">
                    <div style="font-weight: bold; font-size: 1.1rem; margin-bottom: 8px;">First Class AC (1A)</div>
                    <div style="color: var(--danger); font-weight: 600;">WAITLIST - WL 5</div>
                </div>
                <div style="padding: 15px; border: 1px solid var(--border-light); border-radius: 8px;">
                    <div style="font-weight: bold; font-size: 1.1rem; margin-bottom: 8px;">Sleeper (SL)</div>
                    <div style="color: var(--danger); font-weight: 600;">RAC - 15</div>
                </div>
            </div>
            <p style="margin-top: 20px; font-size: 0.9rem; color: var(--text-muted);">* This is simulated mock data.</p>
        </div>
    `;
    
    resDiv.scrollIntoView({ behavior: 'smooth' });
}

// Attach to window for HTML onclick handlers
window.switchBookingTab = switchBookingTab;
window.debouncedStationSearch = debouncedStationSearch;
window.debouncedTrainSearch = debouncedTrainSearch;
window.selectStation = selectStation;
window.selectTrain = selectTrain;
window.checkPNRFromHome = checkPNRFromHome;
window.getTrainChart = getTrainChart;
window.performSearch = performSearch;
window.selectClass = selectClass;
window.startBooking = startBooking;
