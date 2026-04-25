/* ═══════════════════════════════════════════
   AeroRail — js/main.js
   Entry point for modular SPA
   ════════════════════════════════════════════ */

import { state } from './state.js';
import { handleRouting, route } from './router.js';
import { checkAuth, handleAuth, toggleAuthMode, handleModalBackdropClick, handleGoogleAuth, logout } from './auth.js';
import { showAuthModal, hideAuthModal, updateAuthModal, showToast } from './utils.js';
import { updateNavbarLanguageSelector, setAppLanguage } from './i18n.js';
import { fetchRuntimeConfig } from './config.js';
import { 
    switchBookingTab, debouncedStationSearch, debouncedTrainSearch, 
    selectStation, selectTrain, checkPNRFromHome, getTrainChart 
} from './views/home.js';
import { checkLiveStatus } from './views/tracking.js';
import { renderPNR, checkPNR } from './views/pnr.js';
import { 
    performSearch, selectClass, startBooking, 
    addPassengerField, updateTotalFare, confirmBooking 
} from './booking.js';
import { 
    switchAdminTab, processAdminRefund, updateUserRole, updateUserStatus, 
    saveUser, deleteTrain, deleteStation, deleteInstance, 
    showTrainEditor, showStationEditor, showInstanceEditor, 
    showConfigEditor, hideCustomAdminModal 
} from './views/admin.js';
import { money } from './utils.js';

// ── GLOBAL EXPOSURE (FIX 1) ──
window.route = route;
window.handleRouting = handleRouting;
window.checkAuth = checkAuth;
window.handleAuth = handleAuth;
window.toggleAuthMode = toggleAuthMode;
window.handleModalBackdropClick = handleModalBackdropClick;
window.handleGoogleAuth = handleGoogleAuth;
window.logout = logout;
window.showAuthModal = showAuthModal;
window.hideAuthModal = hideAuthModal;
window.updateAuthModal = updateAuthModal;
window.showToast = showToast;
window.setAppLanguage = setAppLanguage;
window.updateNavbarLanguageSelector = updateNavbarLanguageSelector;
window.checkLiveStatus = checkLiveStatus;
window.checkPNR = checkPNR;
window.switchBookingTab = switchBookingTab;
window.debouncedStationSearch = debouncedStationSearch;
window.debouncedTrainSearch = debouncedTrainSearch;
window.selectStation = selectStation;
window.selectTrain = selectTrain;
window.checkPNRFromHome = checkPNRFromHome;
window.getTrainChart = getTrainChart;
window.performSearch = performSearch;
window.selectClass = selectClass;
window.startBooking = startBooking;
window.addPassengerField = addPassengerField;
window.updateTotalFare = updateTotalFare;
window.confirmBooking = confirmBooking;
window.switchAdminTab = switchAdminTab;
window.processAdminRefund = processAdminRefund;
window.updateUserRole = updateUserRole;
window.updateUserStatus = updateUserStatus;
window.saveUser = saveUser;
window.deleteTrain = deleteTrain;
window.deleteStation = deleteStation;
window.deleteInstance = deleteInstance;
window.showTrainEditor = showTrainEditor;
window.showStationEditor = showStationEditor;
window.showInstanceEditor = showInstanceEditor;
window.showConfigEditor = showConfigEditor;
window.hideCustomAdminModal = hideCustomAdminModal;
window.money = money;

// ── INIT ──
document.addEventListener('DOMContentLoaded', async () => {
    const app = document.getElementById('app');
    document.documentElement.lang = state.language;
    
    try {
        await fetchRuntimeConfig();
        try {
            await checkAuth(); 
        } catch (e) {
            console.warn("Auth check failed, proceeding as guest:", e);
        }
        handleRouting();
    } catch (error) {
        console.error("Critical initialization failure:", error);
    }

    updateNavbarLanguageSelector();

    window.onpopstate = () => {
        state.currentPath = window.location.pathname;
        handleRouting();
    };

    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
    });

    window.addEventListener('navbar-update', updateNavbarLanguageSelector);
    window.addEventListener('navbar-updated', updateNavbarLanguageSelector);
    window.addEventListener('language-changed', async () => {
        await checkAuth();
        updateNavbarLanguageSelector();
    });
});
