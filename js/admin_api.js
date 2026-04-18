export const adminApi = {
    getStats: () => fetch('/api/admin/stats').then(r => r.json()),
    getUsers: () => fetch('/api/admin/users').then(r => r.json()),
    updateUser: (id, data) => fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }).then(r => r.json()),
    
    getTrains: () => fetch('/api/admin/trains').then(r => r.json()),
    getStations: () => fetch('/api/admin/stations').then(r => r.json()),
    getPayments: () => fetch('/api/admin/payments').then(r => r.json()),
    getRefunds: () => fetch('/api/admin/refunds').then(r => r.json()),
    processRefund: (id) => fetch(`/api/admin/refunds/process/${id}`, { method: 'POST' }).then(r => r.json()),
    
    getLogs: () => fetch('/api/admin/logs').then(r => r.json()),
    getLiveStatus: () => fetch('/api/admin/live-status').then(r => r.json())
};
