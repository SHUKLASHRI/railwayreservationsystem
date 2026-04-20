import { state, t } from './state.js';
import { showToast, showAuthModal } from './utils.js';

function money(value) {
    const amount = Number(value || 0);
    return `Rs. ${amount.toLocaleString('en-IN')}`;
}

function classOptionsHtml() {
    const classes = state.selectedTrain?.classes?.length
        ? state.selectedTrain.classes
        : [{ class_id: 3, class_code: '3A', class_name: 'AC 3-Tier', base_fare: 2200 }];

    return classes.map(c => {
        const classId = c.class_id || 3;
        const fare = Number(c.base_fare || 0);
        const label = `${c.class_code || ''}${c.class_name ? ` - ${c.class_name}` : ''}`.trim();
        return `<option value="${classId}" data-fare="${fare}">${label} (${money(fare)})</option>`;
    }).join('');
}

function routePayload() {
    const train = state.selectedTrain || {};
    return {
        source_station_id: train.source_station_id,
        destination_station_id: train.dest_station_id || train.destination_station_id,
        source_code: train.source_code,
        dest_code: train.dest_code
    };
}

export async function performSearch() {
    let fromId = document.getElementById('fromId')?.value;
    let toId = document.getElementById('toId')?.value;
    const fromInput = document.getElementById('fromInput')?.value;
    const toInput = document.getElementById('toInput')?.value;
    const date = document.getElementById('journeyDate')?.value;

    if (!fromId && fromInput) fromId = fromInput;
    if (!toId && toInput) toId = toInput;

    if (!fromId || !toId) {
        showToast('Please enter both stations', 'error');
        return;
    }

    const resDiv = document.getElementById('searchResults');
    if (resDiv) resDiv.innerHTML = '<div class="skeleton" style="height: 300px; border-radius: 16px;"></div>';

    const sourceId = encodeURIComponent(fromId);
    const destId = encodeURIComponent(toId);
    const travelDate = date || new Date().toISOString().split('T')[0];

    try {
        const resp = await fetch(`/api/train/search?source_id=${sourceId}&dest_id=${destId}&date=${encodeURIComponent(travelDate)}`);
        const data = await resp.json();

        if (resp.ok && data.status === 'success') {
            state.searchResults = data.trains || [];
            renderTrainResults(state.searchResults);
            if (state.searchResults.length === 0 && data.message) {
                showToast(data.message, 'error');
            }
        } else {
            state.searchResults = [];
            renderTrainResults([]);
            showToast(data.message || 'Unable to search trains right now.', 'error');
        }
    } catch (err) {
        state.searchResults = [];
        renderTrainResults([]);
        showToast('Unable to connect to train search. Please try again.', 'error');
    }
}

export function renderMockTrains(source, dest) {
    renderTrainResults([
        {
            is_mock: true,
            train_type: 'Demo',
            train_name: 'Demo Train',
            train_number: '00000',
            source_name: source,
            dest_name: dest,
            departure_time: '--:--',
            arrival_time: '--:--',
            departure_date: '',
            arrival_date: '',
            duration: '--',
            classes: [{ class_code: '3A', base_fare: 1500 }]
        }
    ]);
}

export function renderTrainResults(trains) {
    const resDiv = document.getElementById('searchResults');
    if (!resDiv) return;

    if (!trains.length) {
        resDiv.innerHTML = `<div style="text-align: center; padding: 60px 20px;"><p style="color: var(--text-muted); font-size: 1.1rem;">${t('no_trains_found')}</p></div>`;
        return;
    }

    resDiv.innerHTML = trains.map(train => {
        const departureDate = train.departure_date || train.journey_date || '';
        const arrivalDate = train.arrival_date || train.journey_date || '';
        const duration = train.duration || '--';
        const bookButton = train.is_mock
            ? '<button class="pill-btn" disabled style="opacity: 0.55;">Demo only</button>'
            : `<button class="pill-btn pill-btn-primary" onclick="startBooking(${train.instance_id})">${t('book_now')}</button>`;

        return `
            <div class="soft-card train-result">
                <div class="train-header">
                    <div class="train-info">
                        <span class="type">${train.train_type || 'Train'}</span>
                        <div class="name">${train.train_name || 'Train Name'}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">#${train.train_number || 'N/A'}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.75rem; font-weight: 800; color: var(--success);">LIVE STATUS</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Platform: 1</div>
                    </div>
                </div>

                <div class="train-route">
                    <div class="route-point">
                        <div class="time">${train.departure_time || '--:--'}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">${departureDate}</div>
                        <div class="station">${train.source_name || 'Source'}</div>
                    </div>
                    <div class="route-path">
                        <div class="duration">${duration}</div>
                    </div>
                    <div class="route-point">
                        <div class="time">${train.arrival_time || '--:--'}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">${arrivalDate}</div>
                        <div class="station">${train.dest_name || 'Destination'}</div>
                    </div>
                </div>

                <div class="train-footer">
                    <div class="availability-row">
                        ${(train.classes || []).map(c => `
                            <div class="class-card" onclick="selectClass(this, ${Number(c.base_fare || 0)})">
                                <div class="code">${c.class_code || 'CL'}</div>
                                <div class="price">${money(c.base_fare)}</div>
                                <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 4px;">AVL: ${c.available_seats ?? '--'}</div>
                            </div>
                        `).join('')}
                    </div>
                    ${bookButton}
                </div>
            </div>
        `;
    }).join('');
}

export function selectClass(el, fare) {
    document.querySelectorAll('.class-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
}

export async function startBooking(instanceId) {
    if (!state.user) {
        showToast(t('please_login_book'), 'error');
        showAuthModal();
        return;
    }

    const selectedTrain = (state.searchResults || []).find(train => String(train.instance_id) === String(instanceId));
    if (!selectedTrain || selectedTrain.is_mock) {
        showToast('This train cannot be booked because it is not a real search result.', 'error');
        return;
    }
    state.selectedTrain = selectedTrain;

    const modal = document.getElementById('bookingModal');
    const content = document.getElementById('bookingModalContent');
    if (!modal || !content) return;

    modal.style.display = 'flex';
    content.innerHTML = `
        <div style="padding: 40px; max-height: 90vh; overflow-y: auto;">
            <h2 style="color: var(--primary);">${t('passenger_details')}</h2>
            <p style="color: var(--text-muted); margin-bottom: 30px;">Enter details for all travelers.</p>
            <div id="passengerList">
                <div class="passenger-form" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1.2fr 1.5fr; gap: 15px; margin-bottom: 20px;">
                    <input type="text" class="p-name rounded-input" placeholder="Full Name" />
                    <input type="number" class="p-age rounded-input" placeholder="Age" />
                    <select class="p-gender rounded-input">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                    <select class="p-class rounded-input" onchange="updateTotalFare()">
                        ${classOptionsHtml()}
                    </select>
                    <select class="p-seat rounded-input">
                        <option value="No Preference">No Preference</option>
                        <option value="Lower">Lower</option>
                        <option value="Middle">Middle</option>
                        <option value="Upper">Upper</option>
                        <option value="Side Lower">Side Lower</option>
                        <option value="Side Upper">Side Upper</option>
                    </select>
                </div>
            </div>
            <button class="btn" style="margin-bottom: 30px; background: var(--border-light); color: var(--text-main);" onclick="addPassengerField()">+ Add Another Passenger</button>
            <div style="border-top: 1px solid var(--border); padding-top: 30px; margin-top: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px;">
                    <div style="flex: 1; min-width: 250px;">
                        <h4 style="margin-bottom: 15px; color: var(--primary);">Payment Gateway</h4>
                        <img src="/static/qr_code.png" alt="UPI QR Code" style="width: 150px; height: 150px; border-radius: 8px; border: 2px solid var(--border-light); margin-bottom: 15px;"/>
                        <div class="input-wrapper">
                            <input type="text" id="upiIdInput" class="rounded-input" placeholder="Enter UPI Transaction ID (or type BYPASS)" style="width: 100%;" required />
                        </div>
                    </div>
                    <div style="text-align: right; display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-end;">
                       <span style="font-size: 0.875rem; color: var(--text-muted);">${t('total_amount')}</span>
                       <div id="totalFareDisplay" style="font-size: 2rem; font-weight: 800; color: var(--accent); margin-bottom: 20px;">Rs. 0</div>
                       <button class="pill-btn pill-btn-primary" onclick="confirmBooking(${instanceId})" style="padding: 16px 32px; font-size: 1.1rem;">${t('confirm_pay')}</button>
                    </div>
                </div>
            </div>
        </div>
        <button class="btn" style="position: absolute; top: 16px; right: 16px; padding: 8px 12px; background: var(--border-light); color: var(--text-main); border-radius: 8px;" onclick="document.getElementById('bookingModal').style.display='none'">x</button>
    `;
    if (window.updateTotalFare) window.updateTotalFare();
}

export function addPassengerField() {
    const div = document.createElement('div');
    div.className = 'passenger-form';
    div.style = 'display: grid; grid-template-columns: 2fr 1fr 1fr 1.2fr 1.5fr; gap: 15px; margin-bottom: 20px;';
    div.innerHTML = `
        <input type="text" class="p-name rounded-input" placeholder="Full Name" />
        <input type="number" class="p-age rounded-input" placeholder="Age" />
        <select class="p-gender rounded-input">
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
        </select>
        <select class="p-class rounded-input" onchange="updateTotalFare()">
            ${classOptionsHtml()}
        </select>
        <select class="p-seat rounded-input">
            <option value="No Preference">No Preference</option>
            <option value="Lower">Lower</option>
            <option value="Middle">Middle</option>
            <option value="Upper">Upper</option>
            <option value="Side Lower">Side Lower</option>
            <option value="Side Upper">Side Upper</option>
        </select>
    `;
    document.getElementById('passengerList')?.appendChild(div);
    if (window.updateTotalFare) window.updateTotalFare();
}

export function updateTotalFare() {
    const classes = Array.from(document.querySelectorAll('.p-class'));
    const total = classes.reduce((sum, select) => {
        const selected = select.options[select.selectedIndex];
        return sum + Number(selected?.dataset?.fare || 0);
    }, 0);
    const display = document.getElementById('totalFareDisplay');
    if (display) display.textContent = money(total);
}

export async function confirmBooking(instanceId) {
    const forms = Array.from(document.querySelectorAll('.passenger-form'));
    const passengers = forms.map(f => {
        const nameParts = f.querySelector('.p-name').value.trim().split(/\s+/).filter(Boolean);
        const classSelect = f.querySelector('.p-class');
        return {
            first_name: nameParts[0] || 'Unknown',
            last_name: nameParts.slice(1).join(' '),
            age: parseInt(f.querySelector('.p-age').value, 10) || 25,
            gender: f.querySelector('.p-gender').value,
            class_id: parseInt(classSelect.value, 10)
        };
    });

    const upiInput = document.getElementById('upiIdInput')?.value.trim();
    if (!upiInput) {
        showToast('Please enter your UPI Transaction ID (or type BYPASS) to confirm payment.', 'error');
        return;
    }

    const classes = Array.from(document.querySelectorAll('.p-class'));
    const total = classes.reduce((sum, select) => {
        const selected = select.options[select.selectedIndex];
        return sum + Number(selected?.dataset?.fare || 0);
    }, 0);

    try {
        const resp = await fetch('/api/booking/book', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                instance_id: instanceId,
                passengers,
                total_fare: total,
                ...routePayload()
            })
        });
        const data = await resp.json();

        if (resp.ok && data.status === 'success') {
            showToast(`Booking Successful! PNR: ${data.pnr}`, 'success');
            document.getElementById('bookingModal').style.display = 'none';
            window.history.pushState({}, '', '/dashboard');
            state.currentPath = '/dashboard';
            window.dispatchEvent(new Event('popstate'));
        } else {
            showToast(data.message || 'Booking failed. Please try again.', 'error');
        }
    } catch (err) {
        showToast('Booking failed because the server could not be reached.', 'error');
    }
}

window.addPassengerField = addPassengerField;
window.confirmBooking = confirmBooking;
window.selectClass = selectClass;
window.performSearch = performSearch;
window.startBooking = startBooking;
window.updateTotalFare = updateTotalFare;
