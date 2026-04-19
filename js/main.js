/* ═══════════════════════════════════════════
   AeroRail — js/main.js
   Entry point for modular SPA
   ════════════════════════════════════════════ */

import { state, i18n } from './state.js';
import { handleRouting } from './router.js';
import { checkAuth } from './auth.js';
import { updateAuthModal } from './utils.js';

// ── INIT ──
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Initial State Sync
        await checkAuth(); 
        
        // 2. Initial Routing
        handleRouting();
    } catch (error) {
        console.error("Initialization failed:", error);
        // Fallback: If EVERYTHING fails, at least render something
        const app = document.getElementById('app');
        if (app && !app.innerHTML.trim()) {
            app.innerHTML = '<div style="padding: 100px; text-align: center;"><h1>Maintenance in Progress</h1><p>We are currently stabilizing our connection. Please refresh in a moment.</p></div>';
        }
    }

    // 3. Navbar Sync (if needed after initial render)
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

    // Listen for custom navbar updates from other modules
    window.addEventListener('navbar-updated', () => {
        updateNavbarLanguageSelector();
    });
});

/* ── DOM HELPERS ── */

function updateNavbarLanguageSelector() {
    const navActions = document.getElementById('navActions');
    if (navActions) {
        let langSelector = navActions.querySelector('.lang-selector');
        if (langSelector) {
            langSelector.innerHTML = `
                <select onchange="setLanguage(this.value)" class="lang-dropdown">
                    <option value="en" ${state.language === 'en' ? 'selected' : ''}>English</option>
                    <option value="hi" ${state.language === 'hi' ? 'selected' : ''}>हिंदी</option>
                </select>
            `;
        }
    }
}

function setLanguage(lang) {
    if (i18n[lang]) {
        state.language = lang;
        localStorage.setItem('aeroRailLanguage', lang);
        handleRouting(); // Re-render current page
        updateNavbarLanguageSelector();
    }
}

// Global exposure for legacy HTML attributes
window.setLanguage = setLanguage;
window.updateNavbarLanguageSelector = updateNavbarLanguageSelector;
