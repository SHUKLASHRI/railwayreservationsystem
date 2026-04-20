/* ═══════════════════════════════════════════
   AeroRail — js/main.js
   Entry point for modular SPA
   ════════════════════════════════════════════ */

import { state } from './state.js';
import { handleRouting } from './router.js';
import { checkAuth } from './auth.js';
import { updateNavbarLanguageSelector } from './utils.js';

// ── INIT ──
document.addEventListener('DOMContentLoaded', async () => {
    const app = document.getElementById('app');
    document.documentElement.lang = state.language;
    
    try {
        // 1. Initial State Sync
        // We catch errors in checkAuth to prevent it from blocking the whole app
        try {
            await checkAuth(); 
        } catch (e) {
            console.warn("Auth check failed, proceeding as guest:", e);
        }
        
        // 2. Initial Routing
        handleRouting();
    } catch (error) {
        console.error("Critical initialization failure:", error);
        
        // Final fallback: If the app hasn't rendered anything, show the maintenance screen
        if (app && (!app.innerHTML || app.innerHTML.length < 50)) {
            app.innerHTML = `
                <div class="container" style="padding: 15vh 20px; text-align: center; color: white; background: #0d1117; min-height: 80vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <div style="font-size: 4rem; margin-bottom: 20px;">🚆</div>
                    <h1 style="font-size: 2.5rem; margin-bottom: 10px; font-family: Syne, sans-serif;">System Restoration</h1>
                    <p style="font-size: 1.2rem; max-width: 600px; opacity: 0.8; line-height: 1.6;">
                        AeroRail is currently undergoing automated database synchronization. 
                        We'll be back online in just a moment.
                    </p>
                    <button onclick="window.location.reload()" class="btn btn-primary" style="margin-top: 30px; padding: 12px 30px;">
                        Check Connection
                    </button>
                    <div style="margin-top: 40px; font-size: 0.8rem; opacity: 0.5;">
                        Status: DB_CON_EXHAUSTION
                    </div>
                </div>
            `;
        }
    }

    // 3. Navbar Sync
    updateNavbarLanguageSelector();

    // 4. Global Event Listeners
    window.onpopstate = () => {
        state.currentPath = window.location.pathname;
        handleRouting();
    };

    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
    });

    // Keep both legacy and current event names for compatibility.
    window.addEventListener('navbar-update', updateNavbarLanguageSelector);
    window.addEventListener('