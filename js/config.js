/**
 * FILE: js/config.js
 * CONTENT: Runtime Configuration Service
 * EXPLANATION: Fetches and caches application configuration from the backend.
 *              Allows the frontend to use environment-backed variables (like API keys)
 *              without hardcoding them in the JS bundles.
 */

export const CONFIG = {
    googleClientId: null
};

export async function fetchRuntimeConfig() {
    try {
        const resp = await fetch('/api/config');
        const data = await resp.json();
        
        if (data.status === 'success') {
            Object.assign(CONFIG, data.config);
            // console.log("Runtime configuration synchronized successfully.");
        }
    } catch (err) {
        console.error("Failed to fetch runtime configuration. Using fallbacks.", err);
    }
}
