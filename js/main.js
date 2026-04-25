/* ═══════════════════════════════════════════
   AeroRail — js/main.js
   Entry point for modular SPA
   ════════════════════════════════════════════ */

import { state } from './state.js';
import * as router from './router.js';
import * as auth from './auth.js';
import * as utils from './utils.js';
import * as i18n from './i18n.js';
import * as config from './config.js';
import * as home from './views/home.js';
import * as tracking from './views/tracking.js';
import * as pnr from './views/pnr.js';
import * as booking from './booking.js';
import * as admin from './views/admin.js';

// ── GLOBAL EXPOSURE (RESILIENT) ──
// This prevents the entire app from crashing if a single function is removed.
// It dynamically attaches all exported functions from our modules to the window.
function exposeToWindow(moduleObj) {
    for (const key in moduleObj) {
        if (typeof moduleObj[key] === 'function') {
            window[key] = moduleObj[key];
        }
    }
}

const modules = [router, auth, utils, i18n, config, home, tracking, pnr, booking, admin];
modules.forEach(exposeToWindow);

// ── INIT ──
document.addEventListener('DOMContentLoaded', async () => {
    const app = document.getElementById('app');
    document.documentElement.lang = state.language;
    
    try {
        await config.fetchRuntimeConfig();
        try {
            await auth.checkAuth(); 
        } catch (e) {
            console.warn("Auth check failed, proceeding as guest:", e);
        }
        router.handleRouting();
    } catch (error) {
        console.error("Critical initialization failure:", error);
    }

    i18n.updateNavbarLanguageSelector();

    window.onpopstate = () => {
        state.currentPath = window.location.pathname;
        router.handleRouting();
    };

    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
    });

    window.addEventListener('navbar-update', i18n.updateNavbarLanguageSelector);
    window.addEventListener('navbar-updated', i18n.updateNavbarLanguageSelector);
    window.addEventListener('language-changed', async () => {
        await auth.checkAuth();
        i18n.updateNavbarLanguageSelector();
    });
});
