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

    const app = document.getElementById('app');
    if (path === '/' || path === '/index.html') {
        renderHome();
    } else if (path === '/pnr') {
        renderPNR();
    } else if (path === '/tracking') {
        renderTracking();
    } else if (path === '/dashboard') {
        renderDashboard();
    } else if (path === '/privacy') {
        app.innerHTML = `
            <div class="container" style="padding: 100px 20px; min-height: 70vh;">
                <h1 style="margin-bottom: 20px; color: var(--primary);">Privacy Policy</h1>
                <p style="font-size: 1.1rem; color: var(--text-muted); line-height: 1.8;">
                    AeroRail is committed to protecting your privacy. This page is currently under development. 
                    Your data security remains our top priority.
                </p>
                <div style="margin-top: 40px; padding: 20px; background: #f8fafc; border-radius: 12px; border-left: 4px solid var(--accent);">
                    <strong>Coming Soon:</strong> Full details on data retention, encryption standards, and user rights.
                </div>
                <button onclick="window.history.back()" class="btn btn-primary" style="margin-top: 30px;">Go Back</button>
            </div>`;
    } else if (path === '/terms') {
        app.innerHTML = `
            <div class="container" style="padding: 100px 20px; min-height: 70vh;">
                <h1 style="margin-bottom: 20px; color: var(--primary);">Terms of Service</h1>
                <p style="font-size: 1.1rem; color: var(--text-muted); line-height: 1.8;">
                    By using AeroRail, you agree to comply with our terms. This section is being updated to reflect 
                    our latest production policies.
                </p>
                <div style="margin-top: 40px; padding: 20px; background: #f8fafc; border-radius: 12px; border-left: 4px solid var(--accent);">
                    <strong>Legal Notice:</strong> AeroRail is an independent platform for educational purposes.
                </div>
                <button onclick="window.history.back()" class="btn btn-primary" style="margin-top: 30px;">Go Back</button>
            </div>`;
    } else if (path === '/contact') {
        app.innerHTML = `
            <div class="container" style="padding: 100px 20px; min-height: 70vh; max-width: 600px;">
                <h1 style="margin-bottom: 20px; color: var(--primary);">Contact Us</h1>
                <p style="margin-bottom: 30px; color: var(--text-muted);">Have questions? Our support team is here to help.</p>
                <form onsubmit="event.preventDefault(); showToast('Message received! We will get back to you.', 'success'); route({target: {closest: () => ({pathname: '/'}), preventDefault: () => {}}})">
                    <div class="field-group" style="margin-bottom: 20px;">
                        <label>Name</label>
                        <input type="text" class="rounded-input" placeholder="Your Name" required>
                    </div>
                    <div class="field-group" style="margin-bottom: 20px;">
                        <label>Email</label>
                        <input type="email" class="rounded-input" placeholder="your@email.com" required>
                    </div>
                    <div class="field-group" style="margin-bottom: 30px;">
                        <label>Message</label>
                        <textarea class="rounded-input" style="height: 120px; resize: none; padding-top: 12px;" placeholder="How can we help?" required></textarea>
                    </div>
                    <button type="submit" class="pill-btn pill-btn-primary" style="width: 100%;">Send Message</button>
                </form>
            </div>`;
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

// Router functions exported for use in other modules
