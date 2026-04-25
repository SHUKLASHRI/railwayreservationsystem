import { SUPPORTED_LANGUAGES, state, t } from './state.js';
import { updateAuthModal } from './utils.js';

export function updateNavbarLanguageSelector() {
    const navHome = document.getElementById('navHome');
    const navPNR = document.getElementById('navPNR');
    const navTracking = document.getElementById('navTracking');
    if (navHome) navHome.textContent = t('home');
    if (navPNR) navPNR.textContent = t('pnr_status');
    if (navTracking) navTracking.textContent = t('live_tracking');

    const selectors = document.querySelectorAll('.lang-selector');
    selectors.forEach((container) => {
        const options = SUPPORTED_LANGUAGES.map(language => `
            <option value="${language.code}" ${state.language === language.code ? 'selected' : ''}>${language.name}</option>
        `).join('');

        container.innerHTML = `
            <select class="rounded-input" aria-label="${t('language')}" onchange="setAppLanguage(this.value)" style="min-width: 150px; height: 40px; padding: 0 10px;">
                ${options}
            </select>
        `;
    });
}

export function setAppLanguage(lang) {
    const supported = SUPPORTED_LANGUAGES.some(language => language.code === lang);
    state.language = supported ? lang : 'en';
    localStorage.setItem('aeroRailLanguage', state.language);
    document.documentElement.lang = state.language;
    window.dispatchEvent(new Event('popstate'));
    window.dispatchEvent(new Event('navbar-update'));
    window.dispatchEvent(new Event('language-changed'));
    const authModal = document.getElementById('authModal');
    if (authModal && authModal.style.display === 'flex') updateAuthModal();
}

// i18n functions exported for use in other modules
