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
                    <a href="#" class="admin-nav-item" onclick="switchAdminTab(event, 'bookings')">
                        <span class="icon">🎟️</span> Bookings
                    </a>
                    <a href="#" class="admin-nav-item" onclick="switchAdminTab(event, 'inventory')">
                        <span class="icon">📦</span> Pricing & Inventory
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
        // Use a routing dictionary instead of a massive 30-line if-else chain (DRY)
        const tabRouters = {
            dashboard: async () => renderDashboardStats((await adminApi.getStats()).stats),
            users: async () => renderUsersTab(await adminApi.getUsers()),
            trains: async () => renderTrainsTab(await adminApi.getTrains()),
            stations: async () => renderStationsTab(await adminApi.getStations()),
            bookings: async () => renderBookingsTab(await adminApi.getBookings()),
            inventory: async () => renderInventoryTab(
                await adminApi.getTrainInstances(),
                await adminApi.getSeatConfigs(),
                await adminApi.getTrains(),
                await adminApi.getTrainClasses()
            ),
            financials: async () => renderFinancialsTab(await adminApi.getPayments(), await adminApi.getRefunds()),
            passengers: async () => renderPassengersTab(await adminApi.getPassengers()),
            logs: async () => renderLogsTab(await adminApi.getLogs(), await adminApi.getLiveStatus())
        };

        if (tabRouters[tab]) {
            await tabRouters[tab]();
        } else {
            throw new Error("Unknown admin tab requested.");
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
        </div>
        <div class="soft-card" style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead style="background: #f1f5f9; border-bottom: 1px solid var(--border-light);">
                    <tr>
                        <th style="padding: 15px 20px;">User</th>
                        <th style="padding: 15px 20px;">Email</th>
                        <th style="padding: 15px 20px;">Role</th>
                        <th style="padding: 15px 20px;">Status</th>
                        <th style="padding: 15px 20px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(u => `
                        <tr style="border-bottom: 1px solid var(--border-light);">
                            <td style="padding: 15px 20px; font-weight: 600;">${u.username}</td>
                            <td style="padding: 15px 20px;">${u.email || '-'}</td>
                            <td style="padding: 15px 20px;">
                                <select onchange="updateUserRole(${u.user_id}, this.value)" style="padding: 5px; border-radius: 6px; border: 1px solid var(--border);">
                                    <option value="customer" ${u.role === 'customer' ? 'selected' : ''}>Customer</option>
                                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                                    <option value="agent" ${u.role === 'agent' ? 'selected' : ''}>Agent</option>
                                </select>
                            </td>
                            <td style="padding: 15px 20px;">
                                <select onchange="updateUserStatus(${u.user_id}, this.value)" style="padding: 5px; border-radius: 6px; border: 1px solid var(--border);">
                                    <option value="ACTIVE" ${u.account_status === 'ACTIVE' ? 'selected' : ''}>Active</option>
                                    <option value="SUSPENDED" ${u.account_status === 'SUSPENDED' ? 'selected' : ''}>Suspended</option>
                                </select>
                            </td>
                            <td style="padding: 15px 20px;">
                                <button class="btn btn-primary" style="padding: 5px 12px; font-size: 0.75rem;" onclick="saveUser(${u.user_id})">Save</button>
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
            <button class="pill-btn pill-btn-primary" onclick="showTrainEditor()">+ Create New Train</button>
        </div>
        <div class="soft-card" style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead style="background: #f1f5f9; border-bottom: 1px solid var(--border-light);">
                    <tr>
                        <th style="padding: 15px 20px;">Train No.</th>
                        <th style="padding: 15px 20px;">Name</th>
                        <th style="padding: 15px 20px;">Type</th>
                        <th style="padding: 15px 20px;">Route</th>
                        <th style="padding: 15px 20px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${trains.map(t => `
                        <tr style="border-bottom: 1px solid var(--border-light);">
                            <td style="padding: 15px 20px; font-weight: 700; color: var(--accent);">#${t.train_number}</td>
                            <td style="padding: 15px 20px; font-weight: 600;">${t.train_name}</td>
                            <td style="padding: 15px 20px;"><span class="train-type">${t.train_type}</span></td>
                            <td style="padding: 15px 20px;">${t.source_name} → ${t.dest_name}</td>
                            <td style="padding: 15px 20px; display: flex; gap: 8px;">
                                <button class="btn" style="padding: 5px 10px; font-size: 0.75rem;" onclick='showTrainEditor(${JSON.stringify(t).replace(/'/g, "&apos;")})'>Edit</button>
                                <button class="btn" style="padding: 5px 10px; font-size: 0.75rem; background: var(--danger); color: white;" onclick="deleteTrain(${t.train_id})">Del</button>
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
            <button class="pill-btn pill-btn-primary" onclick="showStationEditor()">+ Add Station</button>
        </div>
        <div class="soft-card" style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead style="background: #f1f5f9; border-bottom: 1px solid var(--border-light);">
                    <tr>
                        <th style="padding: 15px 20px;">Code</th>
                        <th style="padding: 15px 20px;">Name</th>
                        <th style="padding: 15px 20px;">City / State</th>
                        <th style="padding: 15px 20px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${stations.map(s => `
                        <tr style="border-bottom: 1px solid var(--border-light);">
                            <td style="padding: 15px 20px; font-weight: 800; color: var(--primary);">${s.station_code}</td>
                            <td style="padding: 15px 20px; font-weight: 600;">${s.station_name}</td>
                            <td style="padding: 15px 20px;">${s.city}, ${s.state}</td>
                            <td style="padding: 15px 20px; display: flex; gap: 8px;">
                                <button class="btn" style="padding: 5px 10px; font-size: 0.75rem;" onclick='showStationEditor(${JSON.stringify(s).replace(/'/g, "&apos;")})'>Edit</button>
                                <button class="btn" style="padding: 5px 10px; font-size: 0.75rem; background: var(--danger); color: white;" onclick="deleteStation(${s.station_id})">Del</button>
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

function renderBookingsTab(bookings) {
    const container = document.getElementById('adminContent');
    container.innerHTML = `
        <h2 style="color: var(--primary); margin-bottom: 30px;">System Bookings</h2>
        <div class="soft-card" style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead style="background: #f1f5f9; border-bottom: 1px solid var(--border-light);">
                    <tr>
                        <th style="padding: 15px 20px;">PNR</th>
                        <th style="padding: 15px 20px;">User</th>
                        <th style="padding: 15px 20px;">Train</th>
                        <th style="padding: 15px 20px;">Journey Date</th>
                        <th style="padding: 15px 20px;">Status</th>
                        <th style="padding: 15px 20px;">Total Fare</th>
                    </tr>
                </thead>
                <tbody>
                    ${bookings.map(b => `
                        <tr style="border-bottom: 1px solid var(--border-light);">
                            <td style="padding: 15px 20px; font-weight: 800; color: var(--primary);">${b.pnr}</td>
                            <td style="padding: 15px 20px;">${b.username}</td>
                            <td style="padding: 15px 20px;">#${b.train_number} ${b.train_name}</td>
                            <td style="padding: 15px 20px;">${new Date(b.journey_date).toLocaleDateString()}</td>
                            <td style="padding: 15px 20px;"><span class="availability-pill ${b.status === 'CONFIRMED' ? 'available' : ''}">${b.status}</span></td>
                            <td style="padding: 15px 20px; font-weight: 700;">₹${b.total_fare}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderInventoryTab(instances, configs, trains, classes) {
    const container = document.getElementById('adminContent');
    container.innerHTML = `
        <h2 style="color: var(--primary); margin-bottom: 30px;">Pricing & Inventory</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="font-size: 1.1rem;">Train Instances</h3>
                    <button class="pill-btn pill-btn-primary" onclick="showInstanceEditor()">+ Create</button>
                </div>
                <div class="soft-card" style="overflow-x: auto; padding: 0;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
                        <thead style="background: #f1f5f9; border-bottom: 1px solid var(--border-light);">
                            <tr>
                                <th style="padding: 12px 15px;">Train</th>
                                <th style="padding: 12px 15px;">Date</th>
                                <th style="padding: 12px 15px;">Status</th>
                                <th style="padding: 12px 15px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${instances.map(i => `
                                <tr style="border-bottom: 1px solid var(--border-light);">
                                    <td style="padding: 12px 15px;">#${i.train_number}</td>
                                    <td style="padding: 12px 15px;">${new Date(i.journey_date).toLocaleDateString()}</td>
                                    <td style="padding: 12px 15px;"><span class="availability-pill ${i.status === 'ON_TIME' ? 'available' : ''}">${i.status}</span></td>
                                    <td style="padding: 12px 15px;">
                                        <button class="btn" style="padding: 3px 8px; font-size: 0.7rem;" onclick="deleteInstance(${i.instance_id})">Del</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="font-size: 1.1rem;">Seat Configs & Fare</h3>
                    <button class="pill-btn pill-btn-primary" onclick="showConfigEditor()">+ Manage</button>
                </div>
                <div class="soft-card" style="overflow-x: auto; padding: 0;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
                        <thead style="background: #f1f5f9; border-bottom: 1px solid var(--border-light);">
                            <tr>
                                <th style="padding: 12px 15px;">Train</th>
                                <th style="padding: 12px 15px;">Class</th>
                                <th style="padding: 12px 15px;">Seats</th>
                                <th style="padding: 12px 15px;">Fare</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${configs.map(c => `
                                <tr style="border-bottom: 1px solid var(--border-light);">
                                    <td style="padding: 12px 15px;">#${c.train_number}</td>
                                    <td style="padding: 12px 15px;">${c.class_code}</td>
                                    <td style="padding: 12px 15px;">${c.total_seats}</td>
                                    <td style="padding: 12px 15px; font-weight: 700;">₹${c.base_fare}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    // Global data for editors
    window._adminTrainList = trains;
    window._adminClassList = classes;
}

// ── ADMIN HANDLERS ──

let currentUserData = {};
export const updateUserRole = (id, role) => currentUserData[id] = {...currentUserData[id], role};
export const updateUserStatus = (id, status) => currentUserData[id] = {...currentUserData[id], account_status: status};
export async function saveUser(id) {
    if (!currentUserData[id]) return;
    await adminApi.updateUser(id, currentUserData[id]);
    alert("User updated successfully");
}

/**
 * ── ADMIN MODAL MANAGER ──
 * This class abstracts the repetitive logic of creating, showing, and submitting
 * admin forms, replacing 4 different functions that did the exact same thing.
 */
class AdminEditor {
    static show(title, fieldsHtml, onSubmit) {
        const modalHtml = `
            <div style="padding: 30px;">
                <h3>${title}</h3>
                <form id="genericAdminForm" style="display: grid; gap: 15px; margin-top: 20px;">
                    ${fieldsHtml}
                    <button type="submit" class="pill-btn pill-btn-primary">Save</button>
                </form>
            </div>
        `;
        showCustomAdminModal(modalHtml, async (e) => {
            e.preventDefault();
            await onSubmit();
            hideCustomAdminModal();
        });
    }
}

/**
 * ── ADMIN DELETE HANDLER ──
 * Generic deletion handler to prevent rewriting confirm() logic over and over.
 */
async function handleDeletion(id, typeMsg, apiMethod, tabToReload) {
    if (confirm(`Delete this ${typeMsg}?`)) {
        await apiMethod(id);
        loadAdminTab(tabToReload);
    }
}

export const deleteTrain = (id) => handleDeletion(id, "train? This will affect schedules", adminApi.deleteTrain, 'trains');
export const deleteStation = (id) => handleDeletion(id, "station", adminApi.deleteStation, 'stations');
export const deleteInstance = (id) => handleDeletion(id, "instance? Bookings will be orphaned!", adminApi.deleteTrainInstance, 'inventory');

// ── EDITOR SPAWNERS ──

export function showTrainEditor(t = null) {
    const isEdit = !!t;
    AdminEditor.show(
        isEdit ? 'Edit Train' : 'Create Train',
        `
            <input type="text" id="editTrainNo" placeholder="Train Number" value="${t?.train_number || ''}" required class="rounded-input">
            <input type="text" id="editTrainName" placeholder="Train Name" value="${t?.train_name || ''}" required class="rounded-input">
            <select id="editTrainType" class="rounded-input">
                <option value="Superfast" ${t?.train_type === 'Superfast' ? 'selected' : ''}>Superfast</option>
                <option value="Express" ${t?.train_type === 'Express' ? 'selected' : ''}>Express</option>
                <option value="Vande Bharat" ${t?.train_type === 'Vande Bharat' ? 'selected' : ''}>Vande Bharat</option>
            </select>
            <input type="number" id="editSrcId" placeholder="Source Station ID" value="${t?.source_station_id || ''}" required class="rounded-input">
            <input type="number" id="editDstId" placeholder="Dest Station ID" value="${t?.destination_station_id || ''}" required class="rounded-input">
        `,
        async () => {
            const data = {
                train_number: document.getElementById('editTrainNo').value,
                train_name: document.getElementById('editTrainName').value,
                train_type: document.getElementById('editTrainType').value,
                source_station_id: parseInt(document.getElementById('editSrcId').value),
                destination_station_id: parseInt(document.getElementById('editDstId').value)
            };
            if (isEdit) await adminApi.updateTrain(t.train_id, data);
            else await adminApi.createTrain(data);
            loadAdminTab('trains');
        }
    );
}

export function showStationEditor(s = null) {
    const isEdit = !!s;
    AdminEditor.show(
        isEdit ? 'Edit Station' : 'Add Station',
        `
            <input type="text" id="editStaCode" placeholder="Station Code (e.g. NDLS)" value="${s?.station_code || ''}" required class="rounded-input">
            <input type="text" id="editStaName" placeholder="Station Name" value="${s?.station_name || ''}" required class="rounded-input">
            <input type="text" id="editCity" placeholder="City" value="${s?.city || ''}" required class="rounded-input">
            <input type="text" id="editState" placeholder="State" value="${s?.state || ''}" required class="rounded-input">
        `,
        async () => {
            const data = {
                station_code: document.getElementById('editStaCode').value,
                station_name: document.getElementById('editStaName').value,
                city: document.getElementById('editCity').value,
                state: document.getElementById('editState').value
            };
            if (isEdit) await adminApi.updateStation(s.station_id, data);
            else await adminApi.createStation(data);
            loadAdminTab('stations');
        }
    );
}

export function showInstanceEditor() {
    const trainOptions = (window._adminTrainList || []).map(t => \`<option value="\${t.train_id}">\${t.train_number} - \${t.train_name}</option>\`).join('');
    AdminEditor.show(
        'Create Train Instance',
        `
            <select id="instTrainId" class="rounded-input">${trainOptions}</select>
            <input type="date" id="instDate" required class="rounded-input">
            <select id="instStatus" class="rounded-input">
                <option value="ON_TIME">On Time</option>
                <option value="DELAYED">Delayed</option>
            </select>
        `,
        async () => {
            await adminApi.createTrainInstance({
                train_id: parseInt(document.getElementById('instTrainId').value),
                journey_date: document.getElementById('instDate').value,
                status: document.getElementById('instStatus').value
            });
            loadAdminTab('inventory');
        }
    );
}

export function showConfigEditor() {
    const trainOptions = (window._adminTrainList || []).map(t => \`<option value="\${t.train_id}">\${t.train_number}</option>\`).join('');
    const classOptions = (window._adminClassList || []).map(c => \`<option value="\${c.class_id}">\${c.class_name} (\${c.class_code})</option>\`).join('');
    AdminEditor.show(
        'Manage Seat Config',
        `
            <label>Select Train</label><select id="cfgTrainId" class="rounded-input">${trainOptions}</select>
            <label>Select Class</label><select id="cfgClassId" class="rounded-input">${classOptions}</select>
            <label>Total Seats</label><input type="number" id="cfgSeats" placeholder="Seats (e.g. 50)" required class="rounded-input">
            <label>Base Fare</label><input type="number" id="cfgFare" placeholder="Fare (e.g. 1200)" required class="rounded-input">
        `,
        async () => {
            await adminApi.saveSeatConfig({
                train_id: parseInt(document.getElementById('cfgTrainId').value),
                class_id: parseInt(document.getElementById('cfgClassId').value),
                total_seats: parseInt(document.getElementById('cfgSeats').value),
                base_fare: parseFloat(document.getElementById('cfgFare').value)
            });
            loadAdminTab('inventory');
        }
    );
}

// Simple Modal Helper for Admin
function showCustomAdminModal(html, submitHandler) {
    const modal = document.getElementById('bookingModal');
    const content = document.getElementById('bookingModalContent');
    content.innerHTML = html;
    modal.classList.add('active');
    
    const form = content.querySelector('form');
    if (form) form.onsubmit = submitHandler;
}

export function hideCustomAdminModal() {
    document.getElementById('bookingModal').classList.remove('active');
}

export async function processAdminRefund(id) {
    const res = await adminApi.processRefund(id);
    if (res.status === 'success') {
        alert("Refund processed successfully!");
        loadAdminTab('financials');
    }
}

// Admin functions exported for use in other modules
