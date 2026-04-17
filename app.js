/* ═══════════════════════════════════════════
   AeroRail — app.js
   Core SPA Logic: Routing, Auth, Search, Booking
   ════════════════════════════════════════════ */

const state = {
    user: null,
    currentPath: window.location.pathname,
    searchResults: [],
    selectedTrain: null,
    isRegistering: false
};

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    handleRouting();
    
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
    } else if (path === '/dashboard') {
        renderDashboard();
    } else {
        renderHome(); // Fallback
    }
}

// ── VIEWS ──
function renderHome() {
    document.getElementById('app').innerHTML = `
    <section class="hero">
        <div class="container hero-content">
            <div class="ph-badge" style="margin: 0 auto 20px; display: inline-block; padding: 6px 12px; border-radius: 20px; background: rgba(0,229,255,0.1); color: var(--secondary); font-weight: 800; font-size: 0.75rem;">● LIVE STATUS</div>
            <h1>The Smartest Way <br/>to Travel by Rail.</h1>
            <p>Book tickets, track trains in real-time, and get instant updates on PNR status with AeroRail.</p>
        </div>
    </section>

    <section class="container">
        <div class="search-card glass">
            <div class="search-grid">
                <div class="field-group">
                    <label>From Station</label>
                    <div class="input-wrapper">
                        <input type="text" id="fromInput" placeholder="Enter City/Station" oninput="handleStationSearch(this, 'fromSuggestions')"/>
                        <div class="input-icon">📍</div>
                        <div id="fromSuggestions" class="suggestions"></div>
                        <input type="hidden" id="fromId" />
                    </div>
                </div>
                <div class="field-group">
                    <label>To Station</label>
                    <div class="input-wrapper">
                        <input type="text" id="toInput" placeholder="Enter City/Station" oninput="handleStationSearch(this, 'toSuggestions')"/>
                        <div class="input-icon">🚉</div>
                        <div id="toSuggestions" class="suggestions"></div>
                        <input type="hidden" id="toId" />
                    </div>
                </div>
                <div class="field-group">
                    <label>Journey Date</label>
                    <div class="input-wrapper">
                        <input type="date" id="journeyDate" value="${new Date().toISOString().split('T')[0]}"/>
                    </div>
                </div>
                <button class="btn btn-primary" style="padding: 18px 40px;" onclick="performSearch()">Find Trains</button>
            </div>
        </div>
        <div id="searchResults" class="results-section"></div>
    </section>
    `;
}

async function handleStationSearch(input, suggestionsId) {
    const q = input.value.trim();
    const box = document.getElementById(suggestionsId);
    if (q.length < 2) { box.classList.remove('open'); return; }

    const resp = await fetch(`/api/train/stations/search?q=${q}`);
    const stations = await resp.json();
    
    box.innerHTML = stations.map(s => `
        <div class="suggestion-item" onclick="selectStation('${suggestionsId}', '${s.station_name}', ${s.station_id})">
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

async function performSearch() {
    const fromId = document.getElementById('fromId').value;
    const toId = document.getElementById('toId').value;
    const date = document.getElementById('journeyDate').value;

    if (!fromId || !toId) {
        showToast("Please select stations from suggestions", "error");
        return;
    }

    const resDiv = document.getElementById('searchResults');
    resDiv.innerHTML = '<div class="skeleton" style="height: 300px; border-radius: 16px;"></div>';

    // The backend now handles both station_id (integer) and station_code (string) in these parameters
    const resp = await fetch(`/api/train/search?source_id=${fromId}&dest_id=${toId}&date=${date}`);
    const data = await resp.json();

    if (data.status === 'success') {
        renderTrainResults(data.trains);
    } else {
        resDiv.innerHTML = `<p style="text-align: center; color: var(--text-muted);">${data.message}</p>`;
    }
}

function renderTrainResults(trains) {
    const resDiv = document.getElementById('searchResults');
    if (trains.length === 0) {
        resDiv.innerHTML = '<div style="text-align: center; padding: 40px;">No trains found for this route and date.</div>';
        return;
    }

    resDiv.innerHTML = trains.map(t => `
        <div class="train-card">
            <div class="train-header">
                <div class="train-info">
                    <span class="type">${t.train_type}</span>
                    <div class="name">${t.train_name}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">#${t.train_number}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.75rem, font-weight: 800, color: var(--success);">● LIVE: ON TIME</div>
                    <div style="font-size: 0.75rem, color: var(--text-muted);">Platform: 1</div>
                </div>
            </div>
            
            <div class="train-route">
                <div class="route-point">
                    <div class="time">17:00</div>
                    <div class="station">${t.source_name || 'Source'}</div>
                </div>
                <div class="route-path">
                    <div class="duration">15h 30m</div>
                </div>
                <div class="route-point">
                    <div class="time">08:30</div>
                    <div class="station">${t.dest_name || 'Destination'}</div>
                </div>
            </div>

            <div class="train-footer">
                <div class="availability-row">
                    ${t.classes.map(c => `
                        <div class="class-card" onclick="selectClass(this, ${c.base_fare})">
                            <div class="code">${c.class_code}</div>
                            <div class="price">₹${c.base_fare}</div>
                            <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 4px;">WL: 12</div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-primary" style="padding: 12px 40px;" onclick="startBooking(${t.instance_id})">Book Now</button>
            </div>
        </div>
    `).join('');
}

function selectClass(el, fare) {
    document.querySelectorAll('.class-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
}

// ── AUTH ──
async function handleAuth(e) {
    e.preventDefault();
    const user = document.getElementById('authUsername').value;
    const pass = document.getElementById('authPassword').value;
    const endpoint = state.isRegistering ? '/api/auth/register' : '/api/auth/login';

    const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username: user, password: pass})
    });
    const data = await resp.json();

    if (data.status === 'success') {
        if (state.isRegistering) {
            showToast("Registration successful! Please login.", "success");
            toggleAuthMode();
        } else {
            showToast("Logged in successfully", "success");
            hideAuthModal();
            checkAuth();
        }
    } else {
        showToast(data.message, "error");
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
                <span style="font-weight: 600; font-size: 0.9rem;">Hello, ${data.username}</span>
                <a href="/dashboard" class="btn btn-primary" onclick="route(event)">My Account</a>
                <button class="btn" style="background: #f1f5f9; color: var(--text);" onclick="logout()">Logout</button>
            </div>
        `;
    } else {
        state.user = null;
        navActions.innerHTML = `<button class="btn btn-primary" onclick="showAuthModal()">Login / Register</button>`;
    }
}

async function logout() {
    await fetch('/api/auth/logout');
    state.user = null;
    window.location.href = '/';
}

function showAuthModal() { 
    document.getElementById('authModal').style.display = 'flex'; 
    document.body.style.overflow = 'hidden';
}
function hideAuthModal() { 
    document.getElementById('authModal').style.display = 'none'; 
    document.body.style.overflow = '';
}
function toggleAuthMode() {
    state.isRegistering = !state.isRegistering;
    document.getElementById('modalTitle').textContent = state.isRegistering ? "Join AeroRail" : "Welcome Back";
    document.querySelector('#authForm .btn-primary').textContent = state.isRegistering ? "Create Account" : "Continue";
    document.querySelector('#authForm p').innerHTML = state.isRegistering ? 
        'Already have an account? <a href="#" onclick="toggleAuthMode(event)">Login</a>' : 
        'Don\'t have an account? <a href="#" onclick="toggleAuthMode(event)">Register</a>';
}

// ── BOOKING FLOW ──
async function startBooking(instanceId) {
    if (!state.user) {
        showToast("Please login to book a ticket", "error");
        showAuthModal();
        return;
    }
    
    // In a real app, fetch specific instance details here
    document.getElementById('bookingModal').style.display = 'flex';
    document.getElementById('bookingModalContent').innerHTML = `
        <div style="padding: 40px;">
            <h2>Passenger Details</h2>
            <p style="color: var(--text-muted); margin-bottom: 30px;">Enter details for all travelers.</p>
            <div id="passengerList">
                <div class="passenger-form" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
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
                </div>
            </div>
            <button class="btn" style="margin-bottom: 30px; background: #f1f5f9;" onclick="addPassengerField()">+ Add Another Passenger</button>
            <div style="border-top: 1px solid #eee; padding-top: 30px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                   <span style="font-size: 0.875rem; color: var(--text-muted);">Total Amount</span>
                   <div id="totalFareDisplay" style="font-size: 1.5rem; font-weight: 800; color: var(--primary);">₹2200</div>
                </div>
                <button class="btn btn-primary" onclick="confirmBooking(${instanceId})">Confirm & Pay</button>
            </div>
        </div>
        <button class="btn" style="position: absolute; top: 20px; right: 20px; padding: 10px;" onclick="document.getElementById('bookingModal').style.display='none'">✕</button>
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
        class_id: 3 // Simplified: hardcoding class_id mapping
    }));

    const totalFare = passengers.length * 2200; // Simplified

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
        handleRouting();
    } else {
        showToast(data.message, "error");
    }
}

// ── PNR VIEW ──
function renderPNR() {
    document.getElementById('app').innerHTML = `
    <div class="container" style="padding: 160px 0;">
        <div class="glass" style="max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 24px; text-align: center;">
            <h2 style="margin-bottom: 10px;">Check PNR Status</h2>
            <p style="color: var(--text-muted); margin-bottom: 30px;">Enter your 10-digit PNR number to get live status.</p>
            <div class="field-group" style="margin-bottom: 24px;">
                <div class="input-wrapper">
                    <input type="text" id="pnrQuery" placeholder="e.g. 4235678901" style="text-align: center; font-size: 1.5rem; letter-spacing: 4px;"/>
                </div>
            </div>
            <button class="btn btn-primary" style="width: 100%; justify-content: center; padding: 18px;" onclick="checkPNR()">Track Status</button>
            <div id="pnrResult" style="margin-top: 40px; text-align: left;"></div>
        </div>
    </div>
    `;
}

async function checkPNR() {
    const pnr = document.getElementById('pnrQuery').value.trim();
    if (!pnr) return;

    const resDiv = document.getElementById('pnrResult');
    resDiv.innerHTML = '<div class="skeleton" style="height: 200px; border-radius: 16px;"></div>';

    const resp = await fetch(`/api/booking/pnr/${pnr}`);
    const data = await resp.json();

    if (data.status === 'success') {
        const b = data.booking;
        resDiv.innerHTML = `
            <div style="padding: 24px; border-radius: 16px; background: rgba(0, 229, 255, 0.05); border: 1px solid rgba(0, 229, 255, 0.2);">
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                    <div>
                        <span style="font-size: 0.75rem; font-weight: 800; color: var(--accent);">CONFIRMED</span>
                        <h3 style="font-size: 1.25rem;">${b.train_name}</h3>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 0.75rem; color: var(--text-muted);">JOURNEY DATE</span>
                        <div style="font-weight: 700;">${b.journey_date}</div>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
                   <div>
                      <small style="color: var(--text-muted);">FROM</small>
                      <div style="font-weight: 600;">${b.from_station}</div>
                   </div>
                   <div>
                      <small style="color: var(--text-muted);">TO</small>
                      <div style="font-weight: 600;">${b.to_station}</div>
                   </div>
                </div>
                <div style="border-top: 1px dashed #ccc; padding-top: 20px;">
                   ${data.passengers.map(p => `
                      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span>${p.first_name} ${p.last_name}</span>
                        <span style="font-weight: 700;">${p.coach_number}-${p.seat_number}</span>
                      </div>
                   `).join('')}
                </div>
                <a href="/api/booking/download-ticket/${b.pnr}" class="btn btn-primary" style="width: 100%; margin-top: 24px; justify-content: center;">Download E-Ticket (PDF)</a>
            </div>
        `;
    } else {
        resDiv.innerHTML = `<p style="color: #ef4444;">${data.message}</p>`;
    }
}

// ── DASHBOARD VIEW ──
async function renderDashboard() {
    if (!state.user) { route({preventDefault:()=>{}, target:{closest:()=>({pathname:'/'})}}); return; }

    document.getElementById('app').innerHTML = `
        <div class="container" style="padding: 120px 0;">
            <h1>My Bookings</h1>
            <p style="color: var(--text-muted); margin-bottom: 40px;">Manage your upcoming and past journeys.</p>
            <div id="bookingHistory" class="results-section">
                <div class="skeleton" style="height: 100px; margin-bottom: 20px;"></div>
                <div class="skeleton" style="height: 100px;"></div>
            </div>
        </div>
    `;

    const resp = await fetch('/api/booking/my-bookings');
    const data = await resp.json();
    const historyDiv = document.getElementById('bookingHistory');

    if (data.length === 0) {
        historyDiv.innerHTML = '<p>No bookings found.</p>';
        return;
    }

    historyDiv.innerHTML = data.map(b => `
        <div class="train-card glass" style="grid-template-columns: 3fr 1fr;">
            <div>
                <span class="train-type">${b.status}</span>
                <div class="train-name">${b.train_name}</div>
                <div style="color: var(--text-muted); font-size: 0.9rem;">#${b.train_number} &nbsp;·&nbsp; Journey: ${b.journey_date}</div>
                <div style="margin-top: 10px; font-weight: 700; color: var(--primary);">PNR: ${b.pnr}</div>
            </div>
            <div style="text-align: right;">
                <a href="/api/booking/download-ticket/${b.pnr}" class="btn" style="background: var(--bg);">Ticket PDF</a>
            </div>
        </div>
    `).join('');
}

// ── UTILS ──
function showToast(msg, type) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.style.display = 'block';
    t.style.background = type === 'success' ? '#10b981' : '#ef4444';
    setTimeout(() => t.style.display = 'none', 3000);
}

// ── SCROLL EFFECT ──
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    navbar.classList.toggle('scrolled', window.scrollY > 20);
});
