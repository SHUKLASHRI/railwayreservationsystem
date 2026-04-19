export const adminApi = {
    getStats: () => fetch('/api/admin/stats').then(r => r.json()),
    getUsers: () => fetch('/api/admin/users').then(r => r.json()),
    updateUser: (id, data) => fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    }).then(r => r.json()),
    
    getTrains: () => fetch('/api/admin/trains').then(r => r.json()),
    createTrain: (data) => fetch('/api/admin/trains', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }).then(r => r.json()),
    updateTrain: (id, data) => fetch(`/api/admin/trains/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }).then(r => r.json()),
    deleteTrain: (id) => fetch(`/api/admin/trains/${id}`, { method: 'DELETE' }).then(r => r.json()),

    getStations: () => fetch('/api/admin/stations').then(r => r.json()),
    createStation: (data) => fetch('/api/admin/stations', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }).then(r => r.json()),
    updateStation: (id, data) => fetch(`/api/admin/stations/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }).then(r => r.json()),
    deleteStation: (id) => fetch(`/api/admin/stations/${id}`, { method: 'DELETE' }).then(r => r.json()),

    getPayments: () => fetch('/api/admin/payments').then(r => r.json()),
    getRefunds: () => fetch('/api/admin/refunds').then(r => r.json()),
    processRefund: (id) => fetch(`/api/admin/refunds/process/${id}`, { method: 'POST' }).then(r => r.json()),
    
    getLogs: () => fetch('/api/admin/logs').then(r => r.json()),
    getLiveStatus: () => fetch('/api/admin/live-status').then(r => r.json()),
    getPassengers: () => fetch('/api/admin/passengers').then(r => r.json()),
    getBookings: () => fetch('/api/admin/bookings').then(r => r.json()),

    getTrainInstances: () => fetch('/api/admin/train-instances').then(r => r.json()),
    createTrainInstance: (data) => fetch('/api/admin/train-instances', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }).then(r => r.json()),
    updateTrainInstance: (id, data) => fetch(`/api/admin/train-instances/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }).then(r => r.json()),
    deleteTrainInstance: (id) => fetch(`/api/admin/train-instances/${id}`, { method: 'DELETE' }).then(r => r.json()),

    getTrainClasses: () => fetch('/api/admin/train-classes').then(r => r.json()),
    getSeatConfigs: () => fetch('/api/admin/seat-configs').then(r => r.json()),
    saveSeatConfig: (data) => fetch('/api/admin/seat-configs', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) }).then(r => r.json())
};
