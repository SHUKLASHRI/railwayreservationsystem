import { renderTracking } from './views/tracking.js';
import { renderDashboard } from './views/dashboard.js';
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
