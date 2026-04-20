/**
 * FILE: js/router.js
 * CONTENT: Single-Page Application (SPA) Router
 * EXPLANATION: Manages page transitions without full browser refreshes. It intercept 
 *              link clicks and dynamically swaps the content of the main #app container.
 * USE: Core navigation logic.
 */

import { state } from './state.js';
import { renderHome } from './views/home.js';
import { renderPNR } from './views/pnr.js';
import { renderTracking } from './views/tracking.js';
import { renderDashboard } from './views/dashboard.js';
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
    /**
     * ROUTING HANDLER
     * Explanation: Inspects the current URL path and calls the corresponding 'View' function.
     */
    const path = state.currentPath;

    if (path === '/' || path === '/index.html') {
        renderHome();
    } else if (path === '/pnr') {
        renderPNR();
    } else if (path === '/tracking') {
        renderTracking();
    } else if (path === '/dashboard') {
        renderDashboard();
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
