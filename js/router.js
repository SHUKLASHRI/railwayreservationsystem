import { state } from './state.js';
import { renderHome } from './views/home.js';
import { renderPNR } from './views/pnr.js';
import { renderTracking } from './views/tracking.js';
import { renderDashboard } from './views/dashboard.js';
import { renderProfile } from './views/profile.js'; // Import renderProfile
import { renderBookingConfirmation } from './views/confirmation.js';
import { renderAdminLayout } from './views/admin.js';

export function route(e) {
    if (e && e.preventDefault) e.preventDefault();
    const target = e.target.closest('a');
    if (!target) return;
    
    const href = target.pathname;
    window.history.pushState({}, '', href);
    state.currentPath = href;
    handleRouting();
}

export function handleRouting() {
    const path = state.currentPath;

    if (path === '/' || path === '/index.html') {
        renderHome();
    } else if (path === '/pnr') {
        renderPNR();
    } else if (path === '/tracking') {
        renderTracking();
    } else if (path === '/dashboard') {
        renderDashboard();
    } else if (path === '/profile') { // Handle the new profile route
        renderProfile();
    } else if (path.startsWith('/booking-confirmed/')) {
        const pnr = path.split('/').filter(Boolean)[1];
        renderBookingConfirmation(pnr);
    } else if (path.startsWith('/admin')) {
        if (state.role !== 'admin') {
            window.history.pushState({}, '', '/');
            renderHome();
        } else {
            renderAdminLayout();
        }
    } else {
        renderHome(); // Fallback
    }
}

// Global exposure
window.route = route;
window.handleRouting = handleRouting;
