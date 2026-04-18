/* ═══════════════════════════════════════════
   AeroRail — app.js
   Core SPA Logic: Routing, Auth, Search, Booking
   ════════════════════════════════════════════ */

/* ── INTERNATIONALIZATION (i18n) ── */
const i18n = {
  'en': {
    'home': 'Home',
    'pnr_status': 'PNR Status',
    'live_tracking': 'Live Tracking',
    'login': 'Login / Register',
    'logout': 'Logout',
    'my_account': 'My Account',
    'hello': 'Hello',
    'book_ticket': 'BOOK TICKET',
    'from_station': 'From Station',
    'to_station': 'To Station',
    'journey_date': 'Journey Date',
    'find_trains': 'Find Trains',
    'pnr_status_check': 'Check PNR Status',
    'pnr_placeholder': 'e.g. 4235678901',
    'track_status': 'Track Status',
    'search_trains': 'Search Trains',
    'passenger_details': 'Passenger Details',
    'confirm_pay': 'Confirm & Pay',
    'total_amount': 'Total Amount',
    'no_trains_found': 'No trains found for this route and date.',
    'live_status': 'LIVE STATUS',
    'smartest_way': 'The Smartest Way <br/>to Travel by Rail.',
    'book_track_pnr': 'Book tickets, track trains in real-time, and get instant updates on PNR status with AeroRail.',
    'check_pnr_desc': 'Enter your 10-digit PNR number to get live status.',
    'book_now': 'Book Now',
    'modify_search': 'Modify Search',
    'pnr_status_label': 'PNR Status',
    'charts_vacancy': 'Charts / Vacancy',
    'train_name_number': 'Train Name / Number',
    'boarding_station': 'Boarding Station',
    'get_train_chart': 'Get Train Chart',
    'enter_city_station': 'Enter City/Station',
    'live_train_tracking': 'Live Train Tracking',
    'enter_train_number': 'Enter train number to see real-time location and status.',
    'track_now': 'Track Now',
    'my_bookings': 'My Bookings',
    'manage_journeys': 'Manage your upcoming and past journeys.',
    'no_bookings': 'No bookings found.',
    'ticket_pdf': 'Ticket PDF',
    'confirmed': 'CONFIRMED',
    'journey_date_label': 'JOURNEY DATE',
    'from_label': 'FROM',
    'to_label': 'TO',
    'download_ticket': 'Download E-Ticket (PDF)',
    'please_login_book': 'Please login to book a ticket',
    'registration_success': 'Registration successful! Please login.',
    'logged_in': 'Logged in successfully',
    'login_modal_title': 'Welcome Back',
    'login_modal_desc': 'Login to access bookings and profiles.',
    'register_modal_title': 'Join AeroRail',
    'register_modal_desc': 'Create your account to start booking.',
    'username': 'Username',
    'password': 'Password',
    'dont_have_account': 'Don\'t have an account?',
    'register_link': 'Register',
    'already_have_account': 'Already have an account?',
    'login_link': 'Login',
    'language': 'Language'
  },
  'hi': {
    'home': 'होम',
    'pnr_status': 'PNR स्थिति',
    'live_tracking': 'लाइव ट्रैकिंग',
    'login': 'लॉगिन / पंजीकरण',
    'logout': 'लॉगआउट',
    'my_account': 'मेरा खाता',
    'hello': 'नमस्ते',
    'book_ticket': 'टिकट बुक करें',
    'from_station': 'स्टेशन से',
    'to_station': 'स्टेशन तक',
    'journey_date': 'यात्रा की तारीख',
    'find_trains': 'ट्रेनें खोजें',
    'pnr_status_check': 'PNR स्थिति जांचें',
    'pnr_placeholder': 'उदा. 4235678901',
    'track_status': 'स्थिति ट्रैक करें',
    'search_trains': 'ट्रेनें खोजें',
    'passenger_details': 'यात्री विवरण',
    'confirm_pay': 'पुष्टि और भुगतान करें',
    'total_amount': 'कुल राशि',
    'no_trains_found': 'इस रूट और तारीख के लिए कोई ट्रेन नहीं मिली।',
    'live_status': 'लाइव स्थिति',
    'smartest_way': 'रेल से यात्रा करने का सबसे स्मार्ट तरीका।',
    'book_track_pnr': 'टिकट बुक करें, ट्रेनों को रीयल-टाइम में ट्रैक करें, और PNR स्थिति पर तत्काल अपडेट प्राप्त करें।',
    'check_pnr_desc': 'अपने 10-अंकीय PNR नंबर दर्ज करें लाइव स्थिति प्राप्त करने के लिए।',
    'book_now': 'अभी बुक करें',
    'modify_search': 'खोज संशोधित करें',
    'pnr_status_label': 'PNR स्थिति',
    'charts_vacancy': 'चार्ट / रिक्तता',
    'train_name_number': 'ट्रेन का नाम / संख्या',
    'boarding_station': 'बोर्डिंग स्टेशन',
    'get_train_chart': 'ट्रेन चार्ट प्राप्त करें',
    'enter_city_station': 'शहर/स्टेशन दर्ज करें',
    'live_train_tracking': 'लाइव ट्रेन ट्रैकिंग',
    'enter_train_number': 'रीयल-टाइम स्थान और स्थिति देखने के लिए ट्रेन संख्या दर्ज करें।',
    'track_now': 'अभी ट्रैक करें',
    'my_bookings': 'मेरी बुकिंगें',
    'manage_journeys': 'अपनी आने वाली और पिछली यात्राओं को प्रबंधित करें।',
    'no_bookings': 'कोई बुकिंग नहीं मिली।',
    'ticket_pdf': 'टिकट PDF',
    'confirmed': 'पुष्टि की गई',
    'journey_date_label': 'यात्रा की तारीख',
    'from_label': 'स्टेशन से',
    'to_label': 'स्टेशन तक',
    'download_ticket': 'E-Ticket डाउनलोड करें (PDF)',
    'please_login_book': 'टिकट बुक करने के लिए कृपया लॉगिन करें',
    'registration_success': 'पंजीकरण सफल! कृपया लॉगिन करें।',
    'logged_in': 'सफलतापूर्वक लॉगिन किया गया',
    'login_modal_title': 'स्वागत है',
    'login_modal_desc': 'बुकिंग और प्रोफाइल तक पहुंचने के लिए लॉगिन करें।',
    'register_modal_title': 'AeroRail में शामिल हों',
    'register_modal_desc': 'बुकिंग शुरू करने के लिए अपना खाता बनाएं।',
    'username': 'उपयोगकर्ता नाम',
    'password': 'पासवर्ड',
    'dont_have_account': 'खाता नहीं है?',
    'register_link': 'पंजीकरण करें',
    'already_have_account': 'पहले से खाता है?',
    'login_link': 'लॉगिन',
    'language': 'भाषा'
  }
};

const state = {
    user: null,
    currentPath: window.location.pathname,
    searchResults: [],
    selectedTrain: null,
    isRegistering: false,
    language: localStorage.getItem('aeroRailLanguage') || 'en'
};

/* ── TRANSLATION HELPER ── */
function t(key) {
    return i18n[state.language] && i18n[state.language][key]
        ? i18n[state.language][key]
        : i18n['en'][key] || key;
}

function setLanguage(lang) {
    if (i18n[lang]) {
        state.language = lang;
        localStorage.setItem('aeroRailLanguage', lang);
        handleRouting(); // Re-render current page with new language
    }
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    handleRouting();
    updateNavbarLanguageSelector();

    window.onpopstate = () => {
        state.currentPath = window.location.pathname;
        handleRouting();
    };
});

// ── ROUTING ──
function route(e) {
    if (e) e.preventDefault();
    const href = e.target.closest('a').pathname;
    window.history.pushState({}, '', href);
    state.currentPath = href;
    handleRouting();
}

function handleRouting() {
    const app = document.getElementById('app');
    const path = state.currentPath;

    if (path === '/' || path === '/index.html') {
        renderHome();
    } else if (path === '/pnr') {
        renderPNR();
    } else if (path === '/tracking') {
        renderTracking();
    } else if (path === '/dashboard') {
        renderDashboard();
    } else {
        renderHome(); // Fallback
    }
}

// ── VIEWS ──
function renderHome() {
    document.getElementById('app').innerHTML = `
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
                            <div class="field-group">
                                <label>&nbsp;</label>
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

// ── DEBOUNCE UTILITY ──
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const debouncedStationSearch = debounce(handleStationSearch, 300);

async function handleStationSearch(input, suggestionsId) {
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

function selectStation(suggestionsId, name, codeOrId) {
    const inputId = suggestionsId === 'fromSuggestions' ? 'fromInput' : 'toInput';
    const hiddenId = suggestionsId === 'fromSuggestions' ? 'fromId' : 'toId';
    document.getElementById(inputId).value = name;
    document.getElementById(hiddenId).value = codeOrId;
    document.getElementById(suggestionsId).classList.remove('open');
}

/* ── BOOKING TAB SWITCHING ── */
function switchBookingTab(e, tab) {
    e.preventDefault();

    // Hide all tabs
    document.querySelectorAll('.booking-tab-content').forEach(el => {
        el.classList.remove('active');
    });

    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-underline').forEach(el => {
        el.classList.remove('active');
    });

    // Show selected tab and mark button as active
    const tabId = tab === 'book' ? 'bookTab' : tab === 'pnr' ? 'pnrTab' : 'chartsTab';
    document.getElementById(tabId).classList.add('active');
    e.target.classList.add('active');
}

function checkPNRFromHome() {
    const pnr = document.getElementById('pnrQuery').value.trim();
    if (!pnr) {
        showToast('Please enter a PNR number', "error");
        return;
    }
    // Navigate to PNR page
    window.history.pushState({}, '', '/pnr');
    state.currentPath = '/pnr';
    renderPNR();
    // Auto-fill and check the PNR after rendering
    setTimeout(() => {
        const pnrInput = document.getElementById('pnrQuery');
        if (pnrInput) {
            pnrInput.value = pnr;
            checkPNR();
        }
    }, 100);
}

function getTrainChart() {
    showToast("Charts/Vacancy feature coming soon!", "info");
}

async function performSearch() {
    const fromId = document.getElementById('fromId').value;
    const toId = document.getElementById('toId').value;
    const date = document.getElementById('journeyDate').value;

    if (!fromId || !toId) {
        showToast('Please select both stations', "error");
        return;
    }

    const resDiv = document.getElementById('searchResults');
    resDiv.innerHTML = '<div class="skeleton" style="height: 300px; border-radius: 16px;"></div>';

    try {
        const resp = await fetch(`/api/train/search?source_id=${fromId}&dest_id=${toId}&date=${date}`);
        const data = await resp.json();

        if (data.status === 'success') {
            renderTrainResults(data.trains);
        } else {
            resDiv.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 40px;">${data.message}</p>`;
        }
    } catch (err) {
        resDiv.innerHTML = `<p style="text-align: center; color: var(--accent);">Error loading trains. Please try again.</p>`;
    }
}

function renderTrainResults(trains) {
    const resDiv = document.getElementById('searchResults');
    if (trains.length === 0) {
        resDiv.innerHTML = `<div style="text-align: center; padding: 60px 20px;"><p style="color: var(--text-muted); font-size: 1.1rem;">${t('no_trains_found')}</p></div>`;
        return;
    }

    resDiv.innerHTML = trains.map(train => `
        <div class="soft-card train-result">
            <div class="train-header">
                <div class="train-info">
                    <span class="type">${train.train_type}</span>
                    <div class="name">${train.train_name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">#${train.train_number}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.75rem; font-weight: 800; color: var(--success);">● ${t('live_status')}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">Platform: 1</div>
                </div>
            </div>

            <div class="train-route">
                <div class="route-point">
                    <div class="time">17:00</div>
                    <div class="station">${train.source_name || 'Source'}</div>
                </div>
                <div class="route-path">
                    <div class="duration">15h 30m</div>
                </div>
                <div class="route-point">
                    <div class="time">08:30</div>
                    <div class="station">${train.dest_name || 'Destination'}</div>
                </div>
            </div>

            <div class="train-footer">
                <div class="availability-row">
                    ${train.classes.map(c => `
                        <div class="class-card" onclick="selectClass(this, ${c.base_fare})">
                            <div class="code">${c.class_code}</div>
                            <div class="price">₹${c.base_fare}</div>
                            <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 4px;">WL: 12</div>
                        </div>
                    `).join('')}
                </div>
                <button class="pill-btn pill-btn-primary" onclick="startBooking(${train.instance_id})">${t('book_now')}</button>
            </div>
        </div>
    `).join('');
}

function selectClass(el, fare) {
    document.querySelectorAll('.class-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
}

// ── AUTH ──
async function handleGoogleAuth(response) {
    try {
        const resp = await fetch('/api/auth/google-login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({credential: response.credential})
        });
        const data = await resp.json();

        if (data.status === 'success') {
            showToast(t('logged_in'), "success");
            hideAuthModal();
            window.history.pushState({}, '', '/dashboard');
            state.currentPath = '/dashboard';
            checkAuth();
            handleRouting();
        } else {
            showToast(data.message || 'Google login failed', "error");
        }
    } catch (err) {
        showToast('Connection error during Google login. Please try again.', "error");
    }
}

async function handleAuth(e) {
    e.preventDefault();
    const user = document.getElementById('authUsername').value;
    const pass = document.getElementById('authPassword').value;
    const endpoint = state.isRegistering ? '/api/auth/register' : '/api/auth/login';

    try {
        const resp = await fetch(endpoint, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: user, password: pass})
        });
        const data = await resp.json();

        if (data.status === 'success') {
            if (state.isRegistering) {
                showToast(t('registration_success'), "success");
                state.isRegistering = false;
                updateAuthModal();
                document.getElementById('authForm').reset();
            } else {
                showToast(t('logged_in'), "success");
                hideAuthModal();
                window.history.pushState({}, '', '/dashboard');
                state.currentPath = '/dashboard';
                checkAuth();
                handleRouting();
            }
        } else {
            showToast(data.message || 'An error occurred', "error");
        }
    } catch (err) {
        showToast('Connection error. Please try again.', "error");
    }
}

async function checkAuth() {
    const resp = await fetch('/api/auth/current-user');
    const data = await resp.json();
    const navActions = document.getElementById('navActions');

    if (data.logged_in) {
        state.user = data.username;
        navActions.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-weight: 600; font-size: 0.9rem;">${t('hello')}, ${data.username}</span>
                <a href="/dashboard" class="btn btn-primary" onclick="route(event)">${t('my_account')}</a>
                <button class="btn" style="background: #f1f5f9; color: var(--text);" onclick="logout()">${t('logout')}</button>
            </div>
        `;
    } else {
        state.user = null;
        navActions.innerHTML = `
            <div class="lang-selector"></div>
            <button class="btn btn-primary" onclick="showAuthModal()">${t('login')}</button>
        `;
    }
    updateNavbarLanguageSelector();
}

async function logout() {
    await fetch('/api/auth/logout');
    state.user = null;
    window.location.href = '/';
}

function showAuthModal() {
    document.getElementById('authModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    updateAuthModal();
    
    // Initialize Google Login Button
    if (window.google) {
        google.accounts.id.initialize({
            client_id: "250263355121-nb6fujn8r92kvjavrlbgpqbp1e7vgcj7.apps.googleusercontent.com",
            callback: handleGoogleAuth
        });
        google.accounts.id.renderButton(
            document.getElementById("googleAuthButton"),
            { theme: "outline", size: "large", type: "standard", shape: "pill", width: 250, text: "continue_with" }
        );
    }
}
function hideAuthModal() {
    document.getElementById('authModal').style.display = 'none';
    document.body.style.overflow = '';
}
function updateAuthModal() {
    const titleEl = document.getElementById('modalTitle');
    const descEl = document.getElementById('modalDesc');
    const formEl = document.getElementById('authForm');
    const labels = formEl.querySelectorAll('label');
    const submitBtn = formEl.querySelector('.pill-btn-primary');
    const linkPara = formEl.querySelector('p');

    if (state.isRegistering) {
        titleEl.textContent = t('register_modal_title');
        descEl.textContent = t('register_modal_desc') || 'Create your account to start booking.';
        labels[0].textContent = t('username');
        labels[1].textContent = t('password');
        submitBtn.textContent = 'Create Account';
        linkPara.innerHTML = `${t('already_have_account')} <a href="#" onclick="toggleAuthMode(event)" style="color: var(--accent); text-decoration: none; font-weight: 600;">${t('login_link')}</a>`;
    } else {
        titleEl.textContent = t('login_modal_title');
        descEl.textContent = t('login_modal_desc');
        labels[0].textContent = t('username');
        labels[1].textContent = t('password');
        submitBtn.textContent = 'Continue';
        linkPara.innerHTML = `${t('dont_have_account')} <a href="#" onclick="toggleAuthMode(event)" style="color: var(--accent); text-decoration: none; font-weight: 600;">${t('register_link')}</a>`;
    }
}
function toggleAuthMode() {
    state.isRegistering = !state.isRegistering;
    updateAuthModal();
}

// ── BOOKING FLOW ──
async function startBooking(instanceId) {
    if (!state.user) {
        showToast(t('please_login_book'), "error");
        showAuthModal();
        return;
    }

    document.getElementById('bookingModal').style.display = 'flex';
    document.getElementById('bookingModalContent').innerHTML = `
        <div style="padding: 40px;">
            <h2 style="color: var(--primary);">${t('passenger_details')}</h2>
            <p style="color: var(--text-muted); margin-bottom: 30px;">Enter details for all travelers.</p>
            <div id="passengerList">
                <div class="passenger-form" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <input type="text" class="p-name rounded-input" placeholder="Full Name" />
                    <input type="number" class="p-age rounded-input" placeholder="Age" />
                    <select class="p-gender rounded-input">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                    <select class="p-class rounded-input">
                        <option value="2200">AC 3-Tier (₹2200)</option>
                        <option value="3200">AC 2-Tier (₹3200)</option>
                        <option value="4500">First Class AC (₹4500)</option>
                    </select>
                </div>
            </div>
            <button class="btn" style="margin-bottom: 30px; background: var(--border-light); color: var(--text-main);" onclick="addPassengerField()">+ Add Another Passenger</button>
            <div style="border-top: 1px solid var(--border); padding-top: 30px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                   <span style="font-size: 0.875rem; color: var(--text-muted);">${t('total_amount')}</span>
                   <div id="totalFareDisplay" style="font-size: 1.5rem; font-weight: 800; color: var(--accent);">₹2200</div>
                </div>
                <button class="pill-btn pill-btn-primary" onclick="confirmBooking(${instanceId})">${t('confirm_pay')}</button>
            </div>
        </div>
        <button class="btn" style="position: absolute; top: 16px; right: 16px; padding: 8px 12px; background: var(--border-light); color: var(--text-main); border-radius: 8px;" onclick="document.getElementById('bookingModal').style.display='none'">✕</button>
    `;
}

function addPassengerField() {
    const div = document.createElement('div');
    div.className = 'passenger-form';
    div.style = 'display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;';
    div.innerHTML = `
        <input type="text" class="p-name" placeholder="Full Name" />
        <input type="number" class="p-age" placeholder="Age" />
        <select class="p-gender">
            <option value="Male">Male</option>
            <option value="Female">Female</option>
        </select>
        <select class="p-class">
            <option value="2200">AC 3-Tier (₹2200)</option>
            <option value="3200">AC 2-Tier (₹3200)</option>
            <option value="4500">First Class AC (₹4500)</option>
        </select>
    `;
    document.getElementById('passengerList').appendChild(div);
}

async function confirmBooking(instanceId) {
    const passengers = Array.from(document.querySelectorAll('.passenger-form')).map(f => ({
        first_name: f.querySelector('.p-name').value.split(' ')[0],
        last_name: f.querySelector('.p-name').value.split(' ')[1] || '',
        age: parseInt(f.querySelector('.p-age').value),
        gender: f.querySelector('.p-gender').value,
        class_id: 3
    }));

    const totalFare = passengers.length * 2200;

    try {
        const resp = await fetch('/api/booking/book', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({instance_id: instanceId, passengers, total_fare: totalFare})
        });
        const data = await resp.json();

        if (data.status === 'success') {
            showToast(`Booking Successful! PNR: ${data.pnr}`, "success");
            document.getElementById('bookingModal').style.display = 'none';
            window.history.pushState({}, '', '/dashboard');
            state.currentPath = '/dashboard';
            handleRouting();
        } else {
            showToast(data.message || 'Booking failed', "error");
        }
    } catch (err) {
        showToast('Error processing booking. Please try again.', "error");
    }
}

// ── PNR VIEW ──
function renderPNR() {
    document.getElementById('app').innerHTML = `
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
    updateNavbarLanguageSelector();
}

async function checkPNR() {
    const pnr = document.getElementById('pnrQuery').value.trim();
    if (!pnr) return;

    const resDiv = document.getElementById('pnrResult');
    resDiv.innerHTML = '<div class="skeleton" style="height: 200px; border-radius: 16px;"></div>';

    try {
        const resp = await fetch(`/api/booking/pnr/${pnr}`);
        const data = await resp.json();

        if (data.status === 'success') {
            const b = data.booking;
            resDiv.innerHTML = `
                <div class="soft-card" style="padding: 28px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                        <div>
                            <span class="availability-pill available">${t('confirmed')}</span>
                            <h3 style="font-size: 1.3rem; margin: 12px 0 4px; color: var(--primary);">${b.train_name}</h3>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 0.75rem; color: var(--text-muted);">${t('journey_date_label')}</span>
                            <div style="font-weight: 700; font-size: 1.1rem; color: var(--primary);">${b.journey_date}</div>
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
                            <span style="font-weight: 700; color: var(--primary);">${p.coach_number}-${p.seat_number}</span>
                          </div>
                       `).join('')}
                    </div>
                    <a href="/api/booking/download-ticket/${b.pnr}" class="pill-btn pill-btn-primary" style="width: 100%; text-decoration: none; padding: 16px;">${t('download_ticket')}</a>
                </div>
            `;
        } else {
            resDiv.innerHTML = `<div class="soft-card" style="padding: 24px; text-align: center;"><p style="color: var(--danger);">${data.message}</p></div>`;
        }
    } catch (err) {
        resDiv.innerHTML = `<div class="soft-card" style="padding: 24px; text-align: center;"><p style="color: var(--danger);">Error checking PNR. Please try again.</p></div>`;
    }
}

// ── DASHBOARD VIEW ──
async function renderDashboard() {
    if (!state.user) { route({preventDefault:()=>{}, target:{closest:()=>({pathname:'/'})}}); return; }

    document.getElementById('app').innerHTML = `
        <div class="container" style="padding: 100px 0 80px;">
            <h1 style="color: var(--primary);">${t('my_bookings')}</h1>
            <p style="color: var(--text-muted); margin-bottom: 40px;">${t('manage_journeys')}</p>
            <div id="bookingHistory" class="results-section">
                <div class="skeleton" style="height: 100px; margin-bottom: 20px;"></div>
                <div class="skeleton" style="height: 100px;"></div>
            </div>
        </div>
    `;
    updateNavbarLanguageSelector();

    const resp = await fetch('/api/booking/my-bookings');
    const data = await resp.json();
    const historyDiv = document.getElementById('bookingHistory');

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
}

// ── LIVE TRACKING VIEW ──
function renderTracking() {
    document.getElementById('app').innerHTML = `
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
    updateNavbarLanguageSelector();
}

async function checkLiveStatus() {
    const trainNum = document.getElementById('trackQuery').value.trim();
    if (!trainNum) return;

    const resDiv = document.getElementById('trackingResult');
    resDiv.innerHTML = '<div class="skeleton" style="height: 300px; border-radius: 16px;"></div>';

    try {
        const resp = await fetch(`/api/train/live/${trainNum}`);
        const data = await resp.json();

        if (data.status === 'success') {
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
            resDiv.innerHTML = `<div class="soft-card" style="text-align: center; padding: 40px;"><p style="color: var(--danger);">${data.message}</p></div>`;
        }
    } catch (e) {
        resDiv.innerHTML = `<div class="soft-card" style="text-align: center; padding: 40px;"><p style="color: var(--danger);">Error connecting to live tracking service.</p></div>`;
    }
}

// ── UTILS ──
function showToast(msg, type) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.display = 'block';
    if (type === 'success') {
        toast.style.background = '#10B981';
    } else if (type === 'error') {
        toast.style.background = '#EF4444';
    } else if (type === 'info') {
        toast.style.background = '#0066CC';
    }
    setTimeout(() => toast.style.display = 'none', 3000);
}

function updateNavbarLanguageSelector() {
    const navActions = document.getElementById('navActions');
    if (navActions) {
        // Update language selector - will be called after auth check
        const langSelector = navActions.querySelector('.lang-selector');
        if (langSelector) {
            langSelector.innerHTML = `
                <select onchange="setLanguage(this.value)" class="lang-dropdown">
                    <option value="en" ${state.language === 'en' ? 'selected' : ''}>English</option>
                    <option value="hi" ${state.language === 'hi' ? 'selected' : ''}>हिंदी</option>
                </select>
            `;
        }
    }
}

// ── SCROLL EFFECT ──
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    navbar.classList.toggle('scrolled', window.scrollY > 20);
});
