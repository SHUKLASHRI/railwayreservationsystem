import { state, t } from './state.js';
import { showToast, hideAuthModal, updateAuthModal } from './utils.js';

export async function handleGoogleAuth(response) {
    try {
        const resp = await fetch('/api/auth/google-login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({credential: response.credential})
        });
        const data = await resp.json();

        if (data.status === 'success') {
            state.user = data.username;
            state.role = data.role || 'customer';
            showToast(t('logged_in'), "success");
            hideAuthModal();
            
            // Auto-redirect based on role
            const targetPath = state.role === 'admin' ? '/admin' : '/dashboard';
            window.history.pushState({}, '', targetPath);
            state.currentPath = targetPath;
            
            await checkAuth();
            window.dispatchEvent(new Event('popstate'));
        } else {
            showToast(data.message || 'Google login failed', "error");
        }
    } catch (err) {
        showToast('Connection error during Google login. Please try again.', "error");
    }
}

export async function handleAuth(e) {
    if (e) e.preventDefault();
    const btn = document.getElementById('authSubmitBtn');
    const originalText = btn ? btn.innerText : 'Continue';
    if (btn) {
        btn.disabled = true;
        btn.innerText = 'Please wait...';
    }

    const user = document.getElementById('authUsername')?.value;
    const pass = document.getElementById('authPassword')?.value;
    const endpoint = state.isRegistering ? '/api/auth/register' : '/api/auth/login';

    try {
        const resp = await fetch(endpoint, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: user, password: pass})
        });
        const data = await resp.json();

        if (data.status === 'success') {
            if (state.isRegistering) {
                showToast(t('registration_success'), "success");
                state.isRegistering = false;
                updateAuthModal();
                document.getElementById('authForm')?.reset();
            } else {
                state.user = data.username;
                state.role = data.role || 'customer';
                showToast(t('logged_in'), "success");
                hideAuthModal();

                // Auto-redirect based on role
                const targetPath = state.role === 'admin' ? '/admin' : '/dashboard';
                window.history.pushState({}, '', targetPath);
                state.currentPath = targetPath;

                await checkAuth();
                window.dispatchEvent(new Event('popstate'));
            }
        } else {
            showToast(data.message || 'Invalid username or password', "error");
        }
    } catch (err) {
        showToast('Connection error. Is the server running?', "error");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    }
}

export async function checkAuth() {
    const resp = await fetch('/api/auth/current-user');
    const data = await resp.json();
    const navActions = document.getElementById('navActions');
    if (!navActions) return;

    if (data.logged_in) {
        state.user = data.username;
        state.role = data.role || 'customer';
        
        navActions.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-weight: 600; font-size: 0.9rem;">${t('hello')}, ${data.username}</span>
                <a href="${state.role === 'admin' ? '/admin' : '/dashboard'}" class="btn btn-primary" onclick="route(event)">${state.role === 'admin' ? 'Admin Dashboard' : t('my_account')}</a>
                <button class="btn" style="background: #f1f5f9; color: var(--text);" onclick="logout()">${t('logout')}</button>
            </div>
        `;
    } else {
        state.user = null;
        navActions.innerHTML = `
            <div class="lang-selector"></div>
            <button class="btn btn-primary" onclick="showAuthModal()">${t('login')}</button>
        `;
    }
    // Custom event to update language selector in navbar
    window.dispatchEvent(new Event('navbar-updated'));
}

export async function logout() {
    await fetch('/api/auth/logout');
    state.user = null;
    window.location.href = '/';
}

export function toggleAuthMode(e) {
    if (e) e.preventDefault();
    state.isRegistering = !state.isRegistering;
    updateAuthModal();
}

// Global exposure
window.handleGoogleAuth = handleGoogleAuth;
window.handleAuth = handleAuth;
window.logout = logout;
window.toggleAuthMode = toggleAuthMode;
window.checkAuth = checkAuth;
