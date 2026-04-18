/* ═══════════════════════════════════════════
   AeroRail — main.js
   Entry point for modular SPA
   ════════════════════════════════════════════ */

import { state, i18n } from './js/state.js';
import { handleRouting } from './js/router.js';
import { checkAuth } from './js/auth.js';
import { updateAuthModal } from './js/utils.js';

// ── INIT ──
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initial State Sync
    await checkAuth(); 
    
    // 2. Initial Routing
    handleRouting();

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
        if (!langSelector) {
            // If it's not there (e.g. after a re-render), check if we can find it
            // usually it's part of the navActions innerHTML in checkAuth()
        }
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
