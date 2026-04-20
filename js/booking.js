import { state, t } from './state.js';
import { showToast, showAuthModal } from './utils.js';

export async function performSearch() {
    let fromId = document.getElementById('fromId')?.value;
    let toId = document.getElementById('toId')?.value;
    const fromInput = document.getElementById('fromInput')?.value;
    const toInput = document.getElementById('toInput')?.value;
    const date = document.getElementById('journeyDate')?.value;

    if (!fromId && fromInput) fromId = fromInput;
    if (!toId && toInput) toId = toInput;

    if (!fromId || !toId) {
        showToast('Please enter both stations', "error");
        return;
    }

    const resDiv = document.getElementById('searchResults');
    if (resDiv) resDiv.innerHTML = '<div class="skeleton" style="height: 300px; border-radius: 16px;"></div>';

    const sourceId = fromId;
    const destId = toId;
    const travelDate = date || new Date().toISOString().split('T')[0];

    console.log(`Searching for: ${sourceId} to ${destId} on ${travelDate}`);

    try {
        const resp = await fetch(`/api/train/search?source_id=${sourceId}&dest_id=${destId}&date=${travelDate}`);
        const data = await resp.json();

        if (data.status === 'success') {
            renderTrainResults(data.trains, data.message);
        } else {
            if (resDiv) resDiv.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">🔍</div>
                    <p style="color: var(--text-muted); font-size: 1.1rem; line-height: 1.6;">${data.message || 'No trains found.'}<br/>
                    <span style="font-size: 0.9rem;">Try searching for <strong>New Delhi (NDLS)</strong> to <strong>Mumbai Central (BCT)</strong> to see the seeded results.</span></p>
                </div>
            `;
        }
    } catch (err) {
        if (resDiv) resDiv.innerHTML = `<p style="text-align: center; color: var(--accent); padding: 40px;">Error connecting to the booking service. Please refresh and try again.</p>`;
    }
}

export function renderTrainResults(trains) {
    const resDiv = document.getElementById('searchResults');
    if (!resDiv) return;

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

export function selectClass(el, fare) {
    document.querySelectorAll('.class-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
}

export async function startBooking(instanceId) {
    if (!state.user) {
        showToast(t('please_login_book'), "error");
        showAuthModal();
        return;
    }

    const modal = document.getElementById('bookingModal');
    const content = document.getElementById('bookingModalContent');
    if (!modal || !content) return;

    modal.style.display = 'flex';
    content.innerHTML = `
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
            <div style="border-top: 1px solid var(--border); padding-top: 30px; margin-top: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px;">
                    <div style="flex: 1; min-width: 250px;">
                        <h4 style="margin-bottom: 15px; color: var(--primary);">Payment Gateway</h4>
                        <img src="/static/qr_code.png" alt="UPI QR Code" style="width: 150px; height: 150px; border-radius: 8px; border: 2px solid var(--border-light); margin-bottom: 15px;"/>
                        <div class="input-wrapper">
                            <input type="text" id="upiIdInput" class="rounded-input" placeholder="Enter UPI Transaction ID" style="width: 100%;" required />
                        </div>
                    </div>
                    <div style="text-align: right; display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-end;">
                       <span style="font-size: 0.875rem; color: var(--text-muted);">${t('total_amount')}</span>
                       <div id="totalFareDisplay" style="font-size: 2rem; font-weight: 800; color: var(--accent); margin-bottom: 20px;">₹30</div>
                       <button class="pill-btn pill-btn-primary" onclick="confirmBooking(${instanceId})" style="padding: 16px 32px; font-size: 1.1rem;">${t('confirm_pay')}</button>
                    </div>
                </div>
            </div>
        </div>
        <button class="btn" style="position: absolute; top: 16px; right: 16px; padding: 8px 12px; background: var(--border-light); color: var(--text-main); border-radius: 8px;" onclick="document.getElementById('bookingModal').style.display='none'">✕</button>
    `;
}

export function addPassengerField() {
    const div = document.createElement('div');
    div.className = 'passenger-form';
    div.style = 'display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;';
    div.innerHTML = `
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
    `;
    document.getElementById('passengerList')?.appendChild(div);
}

export async function confirmBooking(instanceId) {
    const passengers = Array.from(document.querySelectorAll('.passenger-form')).map(f => {
        const nameParts = f.querySelector('.p-name').value.split(' ');
        return {
            first_name: nameParts[0],
            last_name: nameParts.slice(1).join(' ') || '',
            age: parseInt(f.querySelector('.p-age').value),
            gender: f.querySelector('.p-gender').value,
            class_id: 3 // Mock class
        };
    });

    const upiInput = document.getElementById('upiIdInput')?.value.trim();
    if (!upiInput) {
        showToast('Please enter your UPI Transaction ID to confirm payment.', 'error');
        return;
    }

    try {
        const resp = await fetch('/api/booking/book', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({instance_id: instanceId, passengers, total_fare: 30})
        });
        const data = await resp.json();

        if (data.status === 'success') {
            showToast(`Booking Successful! PNR: ${data.pnr}`, "success");
            document.getElementById('bookingModal').style.display = 'none';
            window.history.pushState({}, '', '/dashboard');
            state.currentPath = '/dashboard';
            // Trigger router update
            window.dispatchEvent(new Event('popstate'));
        } else {
            showToast(data.message || 'Booking failed', "error");
        }
    } catch (err) {
        showToast('Error processing booking. Please try again.', "error");
    }
}

// Global exposure
window.addPassengerField = addPassengerField;
window.confirmBooking = confirmBooking;
window.selectClass = selectClass;
window.performSearch = performSearch;
window.startBooking = startBooking;
