import { state, t } from './state.js';

export const showToast = (msg, type) => {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'block';
    
    if (type === 'success') toast.style.background = '#10B981';
    else if (type === 'error') toast.style.background = '#EF4444';
    else if (type === 'info') toast.style.background = '#0066CC';
    
    setTimeout(() => toast.style.display = 'none', 3000);
};

export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export function showAuthModal(isRegister = false) {
    state.isRegistering = isRegister === true;
    document.getElementById('authModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    updateAuthModal();
}

export function hideAuthModal() {
    document.getElementById('authModal').style.display = 'none';
    document.body.style.overflow = '';
}

export function updateAuthModal() {
    const titleEl = document.getElementById('modalTitle');
    const descEl = document.getElementById('modalDesc');
    const formEl = document.getElementById('authForm');
    if (!formEl) return;
    
    const labels = formEl.querySelectorAll('label');
    const submitBtn = formEl.querySelector('.pill-btn-primary');
    const linkPara = formEl.querySelector('p');

    if (state.isRegistering) {
        titleEl.textContent = t('register_modal_title');
        descEl.textContent = t('register_modal_desc');
        labels[0].textContent = t('username');
        labels[1].textContent = t('password');
        submitBtn.textContent = 'Create Account';
        linkPara.innerHTML = `${t('already_have_account')} <a href="#" onclick="toggleAuthMode(event)" style="color: var(--accent); text-decoration: none; font-weight: 600;">${t('login_link')}</a>`;
    } else {
        titleEl.textContent = t('login_modal_title');
        descEl.textContent = t('login_modal_desc');
        labels[0].textContent = t('username');
        labels[1].textContent = t('password');
        submitBtn.textContent = 'Continue';
        linkPara.innerHTML = `${t('dont_have_account')} <a href="#" onclick="toggleAuthMode(event)" style="color: var(--accent); text-decoration: none; font-weight: 600;">${t('register_link')}</a>`;
    }
}

export function updateNavbarLanguageSelector() {
    const selectors = document.querySelectorAll('.lang-selector');
    selectors.forEach((container) => {
        container.innerHTML = `
            <select class="rounded-input" onchange="setAppLanguage(this.value)" style="min-width: 120px; height: 40px; padding: 0 10px;">
                <option value="en" ${state.language === 'en' ? 'selected' : ''}>English</option>
                <option value="hi" ${state.language === 'hi' ? 'selected' : ''}>Hindi</option>
            </select>
        `;
    });
}

export function setAppLanguage(lang) {
    state.language = lang === 'hi' ? 'hi' : 'en';
    localStorage.setItem('aeroRailLanguage', state.language);
    window.dispatchEvent(new Event('popstate'));
    window.dispatchEvent(new Event('navbar-update'));
}

// Global exposure
window.showAuthModal = showAuthModal;
window.hideAuthModal = hideAuthModal;
window.updateAuthModal = updateAuthModal;
window.setAppLanguage = setAppLanguage;
