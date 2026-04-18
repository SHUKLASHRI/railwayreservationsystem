import { state } from '../state.js';
import { adminApi } from '../admin_api.js';

export function renderAdminLayout() {
    if (state.role !== 'admin') {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new Event('popstate'));
        return;
    }

    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
        <div class="admin-dashboard" style="display: flex; min-height: calc(100vh - 80px); margin-top: 80px;">
            <!-- SIDEBAR -->
            <aside class="admin-sidebar" style="width: 280px; background: #fff; border-right: 1px solid var(--border-light); padding: 30px 0;">
                <div style="padding: 0 30px 30px;">
                    <h3 style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 20px;">System Admin</h3>
                    <div style="display: flex; align-items: center; gap: 12px; padding: 15px; background: var(--border-light); border-radius: 12px;">
                        <div style="width: 40px; height: 40px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800;">A</div>
                        <div>
                            <div style="font-weight: 700; font-size: 0.9rem;">${state.user}</div>
                            <div style="font-size: 0.75rem; color: var(--success);">Administrator</div>
                        </div>
                    </div>
                </div>
                
                <nav class="admin-nav">
                    <a href="#" class="admin-nav-item active" onclick="switchAdminTab(event, 'dashboard')">
                        <span class="icon">📊</span> Dashboard Overview
                    </a>
                    <a href="#" class="admin-nav-item" onclick="switchAdminTab(event, 'users')">
                        <span class="icon">👥</span> User Management
                    </a>
                    <a href="#" class="admin-nav-item" onclick="switchAdminTab(event, 'trains')">
                        <span class="icon">🚆</span> Train Master
                    </a>
                    <a href="#" class="admin-nav-item" onclick="switchAdminTab(event, 'stations')">
                        <span class="icon">🚉</span> Station Master
                    </a>
                    <a href="#" class="admin-nav-item" onclick="switchAdminTab(event, 'financials')">
                        <span class="icon">💰</span> Financials & Refunds
                    </a>
                    <a href="#" class="admin-nav-item" onclick="switchAdminTab(event, 'passengers')">
                        <span class="icon">👤</span> Passengers
                    </a>
                    <a href="#" class="admin-nav-item" onclick="switchAdminTab(event, 'logs')">
                        <span class="icon">📜</span> Audit Logs
                    </a>
                </nav>
            </aside>

            <!-- MAIN CONTENT -->
            <main id="adminContent" style="flex: 1; padding: 40px; background: #f8fafc; overflow-y: auto;">
                <div class="skeleton" style="height: 400px; border-radius: 20px;"></div>
            </main>
        </div>
    `;

    // Load initial tab
    loadAdminTab('dashboard');
}

export async function switchAdminTab(e, tab) {
    if (e) e.preventDefault();
    document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));
    if (e) e.target.closest('.admin-nav-item').classList.add('active');
    loadAdminTab(tab);
}

async function loadAdminTab(tab) {
    const container = document.getElementById('adminContent');
    container.innerHTML = '<div class="skeleton" style="height: 600px; border-radius: 20px;"></div>';
    
    try {
        if (tab === 'dashboard') {
            const data = await adminApi.getStats();
            renderDashboardStats(data.stats);
        } else if (tab === 'users') {
            const users = await adminApi.getUsers();
            renderUsersTab(users);
        } else if (tab === 'trains') {
            const trains = await adminApi.getTrains();
            renderTrainsTab(trains);
        } else if (tab === 'stations') {
            const stations = await adminApi.getStations();
            renderStationsTab(stations);
        } else if (tab === 'financials') {
            const payments = await adminApi.getPayments();
            const refunds = await adminApi.getRefunds();
            renderFinancialsTab(payments, refunds);
        } else if (tab === 'passengers') {
            const passengers = await adminApi.getPassengers();
            renderPassengersTab(passengers);
        } else if (tab === 'logs') {
            const logs = await adminApi.getLogs();
            const live = await adminApi.getLiveStatus();
            renderLogsTab(logs, live);
        }
    } catch (err) {
        container.innerHTML = `<div class="soft-card" style="padding: 40px; text-align: center; color: var(--danger);">Failed to load admin data: ${err.message}</div>`;
    }
}

function renderDashboardStats(stats) {
    const container = document.getElementById('adminContent');
    container.innerHTML = `
        <h2 style="margin-bottom: 30px; color: var(--primary);">System Overview</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px;">
            <div class="soft-card" style="padding: 30px;">
                <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total Users</div>
                <div style="font-size: 2.5rem; font-weight: 800; margin: 10px 0; color: var(--primary);">${stats.users}</div>
                <div style="color: var(--success); font-size: 0.8rem;">↑ 12% from last month</div>
            </div>
            <div class="soft-card" style="padding: 30px;">
                <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Active Trains</div>
                <div style="font-size: 2.5rem; font-weight: 800; margin: 10px 0; color: var(--accent);">${stats.trains}</div>
                <div style="color: var(--text-muted); font-size: 0.8rem;">98.5% uptime</div>
            </div>
            <div class="soft-card" style="padding: 30px;">
                <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total Bookings</div>
                <div style="font-size: 2.5rem; font-weight: 800; margin: 10px 0; color: var(--primary);">${stats.bookings}</div>
                <div style="color: var(--success); font-size: 0.8rem;">↑ 24% increase</div>
            </div>
            <div class="soft-card" style="padding: 30px;">
                <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total Revenue</div>
                <div style="font-size: 2.5rem; font-weight: 800; margin: 10px 0; color: var(--success);">₹${stats.revenue.toLocaleString()}</div>
                <div style="color: var(--text-muted); font-size: 0.8rem;">Live updates enabled</div>
            </div>
        </div>
        
        <div class="soft-card" style="margin-top: 40px; padding: 40px; text-align: center;">
            <h3 style="margin-bottom: 15px;">System Health</h3>
            <p style="color: var(--text-muted);">All background tasks and web scrapers are currently operational.</p>
        </div>
    `;
}

// Stub function for sub-tabs - these would normally go into their own files
function renderUsersTab(users) {
    const container = document.getElementById('adminContent');
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
            <h2 style="color: var(--primary);">User Management</h2>
            <button class="pill-btn pill-btn-primary">+ Add New User</button>
        </div>
        <div class="soft-card" style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead style="background: #f1f5f9; border-bottom: 1px solid var(--border-light);">
                    <tr>
                        <th style="padding: 15px 20px;">User</th>
                        <th style="padding: 15px 20px;">Email</th>
                        <th style="padding: 15px 20px;">Role</th>
                        <th style="padding: 15px 20px;">Status</th>
                        <th style="padding: 15px 20px;">Created At</th>
                        <th style="padding: 15px 20px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(u => `
                        <tr style="border-bottom: 1px solid var(--border-light);">
                            <td style="padding: 15px 20px; font-weight: 600;">${u.username}</td>
                            <td style="padding: 15px 20px;">${u.email || '-'}</td>
                            <td style="padding: 15px 20px;"><span class="availability-pill ${u.role === 'admin' ? 'available' : ''}">${u.role}</span></td>
                            <td style="padding: 15px 20px;"><span style="color: ${u.account_status === 'ACTIVE' ? 'var(--success)' : 'var(--danger)'}; font-weight: 700;">${u.account_status}</span></td>
                            <td style="padding: 15px 20px; color: var(--text-muted); font-size: 0.8rem;">${new Date(u.created_at).toLocaleDateString()}</td>
                            <td style="padding: 15px 20px;">
                                <button class="btn" style="padding: 5px 10px; font-size: 0.75rem;">Edit</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderTrainsTab(trains) {
    const container = document.getElementById('adminContent');
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
            <h2 style="color: var(--primary);">Train Master</h2>
            <button class="pill-btn pill-btn-primary">+ Create New Train</button>
        </div>
        <div class="soft-card" style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead style="background: #f1f5f9; border-bottom: 1px solid var(--border-light);">
                    <tr>
                        <th style="padding: 15px 20px;">Train No.</th>
                        <th style="padding: 15px 20px;">Name</th>
                        <th style="padding: 15px 20px;">Type</th>
                        <th style="padding: 15px 20px;">Source</th>
                        <th style="padding: 15px 20px;">Destination</th>
                        <th style="padding: 15px 20px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${trains.map(t => `
                        <tr style="border-bottom: 1px solid var(--border-light);">
                            <td style="padding: 15px 20px; font-weight: 700; color: var(--accent);">#${t.train_number}</td>
                            <td style="padding: 15px 20px; font-weight: 600;">${t.train_name}</td>
                            <td style="padding: 15px 20px;"><span class="train-type">${t.train_type}</span></td>
                            <td style="padding: 15px 20px;">${t.source_name}</td>
                            <td style="padding: 15px 20px;">${t.dest_name}</td>
                            <td style="padding: 15px 20px;">
                                <button class="btn" style="padding: 5px 10px; font-size: 0.75rem;">Schedule</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderStationsTab(stations) {
    const container = document.getElementById('adminContent');
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
            <h2 style="color: var(--primary);">Station Master</h2>
            <button class="pill-btn pill-btn-primary">+ Add Station</button>
        </div>
        <div class="soft-card" style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead style="background: #f1f5f9; border-bottom: 1px solid var(--border-light);">
                    <tr>
                        <th style="padding: 15px 20px;">Code</th>
                        <th style="padding: 15px 20px;">Name</th>
                        <th style="padding: 15px 20px;">City</th>
                        <th style="padding: 15px 20px;">State</th>
                        <th style="padding: 15px 20px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${stations.map(s => `
                        <tr style="border-bottom: 1px solid var(--border-light);">
                            <td style="padding: 15px 20px; font-weight: 800; color: var(--primary);">${s.station_code}</td>
                            <td style="padding: 15px 20px; font-weight: 600;">${s.station_name}</td>
                            <td style="padding: 15px 20px;">${s.city}</td>
                            <td style="padding: 15px 20px;">${s.state}</td>
                            <td style="padding: 15px 20px;">
                                <button class="btn" style="padding: 5px 10px; font-size: 0.75rem;">Edit</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderFinancialsTab(payments, refunds) {
    const container = document.getElementById('adminContent');
    container.innerHTML = `
        <h2 style="color: var(--primary); margin-bottom: 30px;">Financial Management</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
            <div>
                <h3 style="margin-bottom: 20px; font-size: 1.1rem;">Recent Payments</h3>
                <div class="soft-card" style="overflow-x: auto; padding: 0;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
                        <thead style="background: #f1f5f9; border-bottom: 1px solid var(--border-light);">
                            <tr>
                                <th style="padding: 12px 15px;">PNR</th>
                                <th style="padding: 12px 15px;">User</th>
                                <th style="padding: 12px 15px;">Amount</th>
                                <th style="padding: 12px 15px;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${payments.slice(0, 10).map(p => `
                                <tr style="border-bottom: 1px solid var(--border-light);">
                                    <td style="padding: 12px 15px; font-weight: 700;">${p.pnr}</td>
                                    <td style="padding: 12px 15px;">${p.username}</td>
                                    <td style="padding: 12px 15px; font-weight: 700;">₹${p.amount}</td>
                                    <td style="padding: 12px 15px;"><span style="color: ${p.status === 'SUCCESS' ? 'var(--success)' : 'var(--danger)'}; font-weight: 700;">${p.status}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div>
                <h3 style="margin-bottom: 20px; font-size: 1.1rem;">Pending Refunds</h3>
                <div class="soft-card" style="overflow-x: auto; padding: 0;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
                        <thead style="background: #f1f5f9; border-bottom: 1px solid var(--border-light);">
                            <tr>
                                <th style="padding: 12px 15px;">PNR</th>
                                <th style="padding: 12px 15px;">Amount</th>
                                <th style="padding: 12px 15px;">Status</th>
                                <th style="padding: 12px 15px;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${refunds.filter(r => r.status === 'PENDING').map(r => `
                                <tr style="border-bottom: 1px solid var(--border-light);">
                                    <td style="padding: 12px 15px; font-weight: 700;">${r.pnr}</td>
                                    <td style="padding: 12px 15px; font-weight: 700;">₹${r.refund_amount}</td>
                                    <td style="padding: 12px 15px;"><span style="color: var(--warning); font-weight: 700;">${r.status}</span></td>
                                    <td style="padding: 12px 15px;">
                                        <button class="pill-btn pill-btn-primary" style="padding: 5px 12px; font-size: 0.7rem;" onclick="processAdminRefund(${r.refund_id})">Process</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderLogsTab(logs, live) {
    const container = document.getElementById('adminContent');
    container.innerHTML = `
        <h2 style="color: var(--primary); margin-bottom: 30px;">System Monitoring</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
            <div>
                <h3 style="margin-bottom: 20px; font-size: 1.1rem;">Audit Logs</h3>
                <div class="soft-card" style="max-height: 500px; overflow-y: auto; padding: 0;">
                    <div style="padding: 15px;">
                        ${logs.map(l => `
                            <div style="padding: 12px; border-bottom: 1px solid var(--border-light); font-size: 0.85rem;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                    <strong style="color: var(--primary);">${l.action_type}</strong>
                                    <span style="color: var(--text-muted); font-size: 0.75rem;">${new Date(l.created_at).toLocaleString()}</span>
                                </div>
                                <div style="color: var(--text-main);">${l.description}</div>
                                <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">User: ${l.username || 'System'} • IP: ${l.ip_address || 'Internal'}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div>
                <h3 style="margin-bottom: 20px; font-size: 1.1rem;">Live Status Cache</h3>
                <div class="soft-card" style="max-height: 500px; overflow-y: auto; padding: 0;">
                    <div style="padding: 15px;">
                        ${live.map(s => {
                            const data = JSON.parse(s.live_data);
                            return `
                                <div style="padding: 12px; border-bottom: 1px solid var(--border-light); font-size: 0.85rem;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                        <strong style="color: var(--accent);">#${s.train_number}</strong>
                                        <span style="color: var(--text-muted); font-size: 0.75rem;">${new Date(s.updated_at).toLocaleString()}</span>
                                    </div>
                                    <div style="color: var(--success); font-weight: 700;">${data.statusMessage || 'Running'}</div>
                                    <div style="font-size: 0.75rem; color: var(--text-main); margin-top: 2px;">Next: ${data.nextStation || 'N/A'}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderPassengersTab(passengers) {
    const container = document.getElementById('adminContent');
    container.innerHTML = `
        <h2 style="color: var(--primary); margin-bottom: 30px;">Passenger Manifest</h2>
        <div class="soft-card" style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead style="background: #f1f5f9; border-bottom: 1px solid var(--border-light);">
                    <tr>
                        <th style="padding: 15px 20px;">Name</th>
                        <th style="padding: 15px 20px;">Age/Gender</th>
                        <th style="padding: 15px 20px;">PNR</th>
                        <th style="padding: 15px 20px;">Class</th>
                        <th style="padding: 15px 20px;">Status</th>
                        <th style="padding: 15px 20px;">Seat</th>
                    </tr>
                </thead>
                <tbody>
                    ${passengers.map(p => `
                        <tr style="border-bottom: 1px solid var(--border-light);">
                            <td style="padding: 15px 20px; font-weight: 600;">${p.first_name} ${p.last_name}</td>
                            <td style="padding: 15px 20px;">${p.age} / ${p.gender}</td>
                            <td style="padding: 15px 20px; font-weight: 700;">${p.pnr}</td>
                            <td style="padding: 15px 20px;">${p.class_code}</td>
                            <td style="padding: 15px 20px;"><span class="availability-pill ${p.status === 'CONFIRMED' ? 'available' : ''}">${p.status}</span></td>
                            <td style="padding: 15px 20px; font-weight: 700; color: var(--primary);">${p.coach_number || '-'}-${p.seat_number || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Global exposure
window.switchAdminTab = switchAdminTab;
window.processAdminRefund = async (id) => {
    const res = await adminApi.processRefund(id);
    if (res.status === 'success') {
        alert("Refund processed successfully!");
        loadAdminTab('financials');
    }
};
