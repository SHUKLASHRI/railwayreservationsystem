import { state, t } from '../state.js';

export async function renderProfile() {
    const app = document.getElementById('app');
    if (!app) return;

    if (!state.user) {
        window.location.href = '/'; // Redirect to home if not logged in
        return;
    }

    const response = await fetch('/api/auth/me');
    const data = await response.json();

    if (data.status === 'success' && data.user) {
        const user = data.user;
        app.innerHTML = `
            <div class="container my-5">
                <h1 class="text-center mb-4">${t('my_profile')}</h1>
                <div class="card p-4 shadow-sm mx-auto" style="max-width: 600px;">
                    <h3 class="card-title mb-3">${t('profile_details')}</h3>
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item"><strong>${t('username')}:</strong> ${user.username}</li>
                        <li class="list-group-item"><strong>Email:</strong> ${user.email || 'N/A'}</li>
                        <li class="list-group-item"><strong>Phone:</strong> ${user.phone || 'N/A'}</li>
                        <li class="list-group-item"><strong>First Name:</strong> ${user.first_name || 'N/A'}</li>
                        <li class="list-group-item"><strong>Last Name:</strong> ${user.last_name || 'N/A'}</li>
                        <li class="list-group-item"><strong>Date of Birth:</strong> ${user.date_of_birth || 'N/A'}</li>
                        <li class="list-group-item"><strong>Gender:</strong> ${user.gender || 'N/A'}</li>
                        <li class="list-group-item"><strong>Role:</strong> ${user.role}</li>
                    </ul>
                    <div class="mt-4 text-center">
                        <a href="/my-bookings" class="btn btn-primary" onclick="route(event)">${t('my_bookings')}</a>
                    </div>
                </div>
            </div>
        `;
    } else {
        app.innerHTML = `<div class="container my-5 text-center"><p>${data.message || 'Failed to load profile data.'}</p></div>`;
    }
}