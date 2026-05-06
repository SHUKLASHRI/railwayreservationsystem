/**
 * FILE: js/admin_api.js
 * CONTENT: Admin API Interface
 * EXPLANATION: Centralized API calls for the admin dashboard. 
 * Refactored to use a reusable fetch helper to eliminate spaghetti code.
 */

class ApiClient {
    /** 
     * Reusable fetch method to eliminate duplicate fetch logic 
     * Handles both GET and POST/PUT requests seamlessly.
     */
    static async request(endpoint, method = 'GET', body = null) {
        const options = { method };
        if (body) {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(body);
        }
        const res = await fetch(`/api/admin/${endpoint}`, options);
        return res.json();
    }

    /** 
     * Dynamic CRUD generator to handle repeated 1-line differences.
     * Generates get, create, update, delete methods automatically.
     */
    static crud(resource) {
        return {
            get: () => this.request(resource),
            create: (data) => this.request(resource, 'POST', data),
            update: (id, data) => this.request(`${resource}/${id}`, 'PUT', data),
            delete: (id) => this.request(`${resource}/${id}`, 'DELETE')
        };
    }
}

// Generate standard endpoints dynamically
const users = ApiClient.crud('users');
const trains = ApiClient.crud('trains');
const stations = ApiClient.crud('stations');
const trainInstances = ApiClient.crud('train-instances');

export const adminApi = {
    // Standard CRUD
    getUsers: users.get,
    updateUser: users.update,

    getTrains: trains.get,
    createTrain: trains.create,
    updateTrain: trains.update,
    deleteTrain: trains.delete,

    getStations: stations.get,
    createStation: stations.create,
    updateStation: stations.update,
    deleteStation: stations.delete,

    getTrainInstances: trainInstances.get,
    createTrainInstance: trainInstances.create,
    updateTrainInstance: trainInstances.update,
    deleteTrainInstance: trainInstances.delete,

    // Specialized One-off Endpoints
    getStats: () => ApiClient.request('stats'),
    getPayments: () => ApiClient.request('payments'),
    getRefunds: () => ApiClient.request('refunds'),
    processRefund: (id) => ApiClient.request(`refunds/process/${id}`, 'POST'),
    getLogs: () => ApiClient.request('logs'),
    getLiveStatus: () => ApiClient.request('live-status'),
    getPassengers: () => ApiClient.request('passengers'),
    getBookings: () => ApiClient.request('bookings'),
    getTrainClasses: () => ApiClient.request('train-classes'),
    getSeatConfigs: () => ApiClient.request('seat-configs'),
    saveSeatConfig: (data) => ApiClient.request('seat-configs', 'POST', data)
};
