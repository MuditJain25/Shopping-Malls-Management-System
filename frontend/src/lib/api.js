// ═══════════════════════════════════════════════════════════════
// API CLIENT — Spring Boot Backend Integration
// ═══════════════════════════════════════════════════════════════
//
// This file contains the API client for connecting to your Spring Boot
// backend. Currently the app uses mock data (see mockData.js), but all
// the real API calls are written here as commented-out code.
//
// To switch to the real backend:
//   1. Set VITE_API_BASE_URL in your .env file (e.g. http://localhost:8080/api)
//   2. Uncomment the fetch calls in each function below
//   3. Remove the mock data return statements
//
// The Spring Boot backend should expose these REST endpoints
// (adjust paths to match your controller mappings):
//
//   POST   /api/auth/login          → { email, password } → { token, user }
//   POST   /api/auth/signup         → { firstName, lastName, email, password, role } → { token, user }
//   POST   /api/auth/logout         → void
//   GET    /api/malls               → Mall[]
//   GET    /api/malls/{id}          → Mall
//   GET    /api/malls/{id}/stores   → Store[]
//   GET    /api/malls/{id}/products/top → Product[] (top-selling)
//   GET    /api/stores/{id}         → Store
//   GET    /api/stores/{id}/products → Product[]
//   PUT    /api/stores/{id}/products/{pid} → toggle to_show
//   GET    /api/stores/available     → Store[] (available for lease)
//   GET    /api/bid-events          → BidEvent[]
//   GET    /api/bid-events/{id}     → BidEvent
//   GET    /api/bid-events/{id}/bids → Bid[]
//   POST   /api/bid-events/{id}/bids → { userId, bidAmount } → Bid
//   PUT    /api/bid-events/{id}/finalize → finalize winning bid
//   GET    /api/tenants             → Tenant[]
//   GET    /api/tenants/{id}        → Tenant
//   GET    /api/tenants/{id}/stores → Store[]
//   GET    /api/tenants/{id}/employees → Employee[]
//   POST   /api/tenants/{id}/employees → create employee
//   GET    /api/tenants/{id}/revenue → RevenueInformation[]
//   POST   /api/tenants/{id}/revenue → submit revenue info
//   GET    /api/tenants/{id}/transactions → FinancialTransaction[]
//   GET    /api/employees/{id}      → Employee
//   GET    /api/employees/{id}/leave-requests → LeaveRequest[]
//   POST   /api/employees/{id}/leave-requests → apply for leave
//   GET    /api/employees/{id}/payroll → PayrollRecord[]
//   GET    /api/employees/{id}/attendance → Attendance[]
//   POST   /api/employees/{id}/attendance/check-in
//   POST   /api/employees/{id}/attendance/check-out
//   GET    /api/malls/{id}/managers → MallManager
//   GET    /api/managers            → MallManager[]
//   POST   /api/managers            → create Mall Manager
//   GET    /api/executives/{id}     → EnterpriseExecutive
//   GET    /api/executives/{id}/malls → Mall[]
//   GET    /api/analytics/mall/{id} → { revenue, customers, avgRevenuePerStore, partners }
// ═══════════════════════════════════════════════════════════════

import * as mock from './mockData.js';

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// function getAuthHeaders() {
//   const token = localStorage.getItem('auth_token');
//   return {
//     'Content-Type': 'application/json',
//     ...(token ? { Authorization: `Bearer ${token}` } : {}),
//   };
// }

// async function apiFetch(path, options = {}) {
//   const response = await fetch(`${API_BASE_URL}${path}`, {
//     ...options,
//     headers: { ...getAuthHeaders(), ...options.headers },
//   });
//   if (!response.ok) {
//     const error = await response.json().catch(() => ({ message: 'Request failed' }));
//     throw new Error(error.message || `HTTP ${response.status}`);
//   }
//   return response.json();
// }

// ── Auth ────────────────────────────────────────────────────────
export async function apiLogin(email, password) {
  // return apiFetch('/auth/login', {
  //   method: 'POST',
  //   body: JSON.stringify({ email, password }),
  // });

  // MOCK: check against demo users
  const user = mock.demoUsers.find(u => u.email === email && u.password === password);
  if (!user) throw new Error('Invalid email or password');
  const { password: _pw, ...userWithoutPw } = user;
  return userWithoutPw;
}

export async function apiSignup({ firstName, lastName, email, password, role }) {
  // return apiFetch('/auth/signup', {
  //   method: 'POST',
  //   body: JSON.stringify({ firstName, lastName, email, password, role }),
  // });

  // MOCK: create a new user object
  return {
    id: `u${Date.now()}`,
    email,
    role,
    firstName,
    lastName,
    profileId: `u${Date.now()}`,
  };
}

export async function apiLogout() {
  // return apiFetch('/auth/logout', { method: 'POST' });
  return { success: true };
}

// ── Malls ──────────────────────────────────────────────────────
export async function apiGetMalls() {
  // return apiFetch('/malls');
  return mock.malls;
}

export async function apiGetMallById(id) {
  // return apiFetch(`/malls/${id}`);
  return mock.getMallById(id);
}

// ── Stores ─────────────────────────────────────────────────────
export async function apiGetStoresByMall(mallId) {
  // return apiFetch(`/malls/${mallId}/stores`);
  return mock.getStoresByMall(mallId);
}

export async function apiGetAvailableStores(mallId) {
  // return apiFetch(`/stores/available?mallId=${mallId}`);
  return mock.getAvailableStores(mallId);
}

export async function apiGetStoreById(id) {
  // return apiFetch(`/stores/${id}`);
  return mock.getStoreById(id);
}

// ── Products ───────────────────────────────────────────────────
export async function apiGetProductsByStore(storeId) {
  // return apiFetch(`/stores/${storeId}/products`);
  return mock.getProductsByStore(storeId);
}

export async function apiGetTopSellingProducts(mallId) {
  // return apiFetch(`/malls/${mallId}/products/top`);
  return mock.getTopSellingProducts(mallId);
}

export async function apiToggleProductVisibility(storeId, productId, toShow) {
  // return apiFetch(`/stores/${storeId}/products/${productId}`, {
  //   method: 'PUT',
  //   body: JSON.stringify({ to_show: toShow }),
  // });
  return { success: true };
}

// ── Bid Events & Bids ──────────────────────────────────────────
export async function apiGetBidEventsByMall(mallId) {
  // return apiFetch(`/malls/${mallId}/bid-events`);
  return mock.getBidEventsByMall(mallId);
}

export async function apiGetBidsByEvent(eventId) {
  // return apiFetch(`/bid-events/${eventId}/bids`);
  return mock.getBidsByEvent(eventId);
}

export async function apiPlaceBid(eventId, userId, bidAmount, bidderName) {
  // return apiFetch(`/bid-events/${eventId}/bids`, {
  //   method: 'POST',
  //   body: JSON.stringify({ userId, bidAmount }),
  // });
  // MOCK: return a new bid object
  const eventBids = mock.bids.filter(b => b.event_id === eventId);
  const winningBid = eventBids.find(b => b.status === 'winning');
  if (winningBid) winningBid.status = 'outbid';
  const newBid = {
    bid_id: `b${Date.now()}`,
    user_id: userId,
    event_id: eventId,
    bid_amount: bidAmount,
    round_number: eventBids.length + 1,
    bid_date: new Date().toISOString(),
    status: 'winning',
    bidder_name: bidderName,
  };
  mock.bids.push(newBid);
  return newBid;
}

export async function apiFinalizeBidEvent(eventId, allocation) {
  // return apiFetch(`/bid-events/${eventId}/finalize`, {
  //   method: 'PUT',
  //   body: JSON.stringify({ final_allocation: allocation }),
  // });
  const event = mock.bidEvents.find(be => be.event_id === eventId);
  if (event) {
    event.status = 'finalized';
    event.final_allocation = allocation;
  }
  return event;
}

// ── Tenants ────────────────────────────────────────────────────
export async function apiGetTenants() {
  // return apiFetch('/tenants');
  return mock.tenants;
}

export async function apiGetTenantById(id) {
  // return apiFetch(`/tenants/${id}`);
  return mock.getTenantById(id);
}

export async function apiGetStoresByTenant(tenantId) {
  // return apiFetch(`/tenants/${tenantId}/stores`);
  return mock.getStoresByTenant(tenantId);
}

export async function apiGetEmployeesByStore(storeId) {
  // return apiFetch(`/stores/${storeId}/employees`);
  return mock.getEmployeesByStore(storeId);
}

export async function apiAddEmployee(employeeData) {
  // return apiFetch('/employees', {
  //   method: 'POST',
  //   body: JSON.stringify(employeeData),
  // });
  const newEmp = { ...employeeData, employee_id: `e${Date.now()}` };
  mock.employees.push(newEmp);
  return newEmp;
}

export async function apiGetRevenueByTenant(tenantId) {
  // return apiFetch(`/tenants/${tenantId}/revenue`);
  return mock.getRevenueByTenant(tenantId);
}

export async function apiSubmitRevenue(tenantId, { description, month, amount }) {
  // return apiFetch(`/tenants/${tenantId}/revenue`, {
  //   method: 'POST',
  //   body: JSON.stringify({ description, month, amount }),
  // });
  const newRecord = {
    tenant_id: tenantId,
    information_id: `ri${Date.now()}`,
    description,
    month,
    amount,
    submitted_date: new Date().toISOString().split('T')[0],
  };
  mock.revenueInfo.push(newRecord);
  return newRecord;
}

export async function apiGetTransactionsByTenant(tenantId) {
  // return apiFetch(`/tenants/${tenantId}/transactions`);
  return mock.getTransactionsByTenant(tenantId);
}

// ── Mall Employees ─────────────────────────────────────────────
export async function apiGetEmployeesByMall(mallId) {
  // return apiFetch(`/malls/${mallId}/employees`);
  return mock.getEmployeesByMall(mallId);
}

// ── Mall Managers ──────────────────────────────────────────────
export async function apiGetManagers() {
  // return apiFetch('/managers');
  return mock.mallManagers;
}

export async function apiGetManagerByMall(mallId) {
  // return apiFetch(`/malls/${mallId}/manager`);
  return mock.getManagerByMall(mallId);
}

export async function apiCreateManager(managerData) {
  // return apiFetch('/managers', {
  //   method: 'POST',
  //   body: JSON.stringify(managerData),
  // });
  const newMgr = { ...managerData, manager_id: `mm${Date.now()}`, date_joined: new Date().toISOString().split('T')[0] };
  mock.mallManagers.push(newMgr);
  return newMgr;
}

// ── Executives ─────────────────────────────────────────────────
export async function apiGetExecutiveById(id) {
  // return apiFetch(`/executives/${id}`);
  return mock.executives.find(ex => ex.executive_id === id);
}

// ── Employee Self-Service ──────────────────────────────────────
export async function apiGetEmployeeById(id) {
  // return apiFetch(`/employees/${id}`);
  return mock.getEmployeeById(id);
}

export async function apiGetLeaveRequests(empId) {
  // return apiFetch(`/employees/${empId}/leave-requests`);
  return mock.getLeaveRequestsByEmployee(empId);
}

export async function apiApplyLeave(empId, { start_date, end_date, reason }) {
  // return apiFetch(`/employees/${empId}/leave-requests`, {
  //   method: 'POST',
  //   body: JSON.stringify({ start_date, end_date, reason }),
  // });
  const newReq = {
    e_id: empId,
    request_id: `lr${Date.now()}`,
    start_date,
    end_date,
    status: 'pending',
    reason,
  };
  mock.leaveRequests.push(newReq);
  return newReq;
}

export async function apiGetPayroll(empId) {
  // return apiFetch(`/employees/${empId}/payroll`);
  return mock.getPayrollByEmployee(empId);
}

export async function apiGetAttendance(empId) {
  // return apiFetch(`/employees/${empId}/attendance`);
  return mock.getAttendanceByEmployee(empId);
}

export async function apiCheckIn(empId) {
  // return apiFetch(`/employees/${empId}/attendance/check-in`, { method: 'POST' });
  const today = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().slice(0, 5);
  const existing = mock.attendanceRecords.find(a => a.e_id === empId && a.date === today);
  if (existing) {
    existing.check_in_time = time;
    return existing;
  }
  const record = { e_id: empId, date: today, check_in_time: time, check_out_time: null };
  mock.attendanceRecords.push(record);
  return record;
}

export async function apiCheckOut(empId) {
  // return apiFetch(`/employees/${empId}/attendance/check-out`, { method: 'POST' });
  const today = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().slice(0, 5);
  const existing = mock.attendanceRecords.find(a => a.e_id === empId && a.date === today);
  if (existing) {
    existing.check_out_time = time;
    return existing;
  }
  return null;
}

// ── Analytics ─────────────────────────────────────────────────
export async function apiGetMallAnalytics(mallId) {
  // return apiFetch(`/analytics/mall/${mallId}`);
  // MOCK: compute from mock data
  const mallStores = mock.getStoresByMall(mallId);
  const occupiedStores = mallStores.filter(s => s.status === 'occupied');
  const mall = mock.malls.find(m => m.mall_id === mallId);
  const mallName = mall ? (
    mall.city === 'New York' ? 'Heritage Plaza Mall' :
    mall.city === 'San Jose' ? 'Tech Park Mall' :
    'Lakeshore Mall'
  ) : '';
  const mallTransactions = mock.transactions.filter(t => t.receiver === mallName);
  const totalRevenue = mallTransactions.reduce((sum, t) => sum + t.amount, 0);
  const mallTenants = mock.tenants.filter(t =>
    t.store_ids.some(sid => mallStores.some(s => s.store_id === sid))
  );
  return {
    totalRevenue,
    customerCount: 12500 + (mallId === 'm1' ? 3200 : mallId === 'm2' ? 2100 : 1800),
    avgRevenuePerStore: occupiedStores.length ? Math.round(totalRevenue / occupiedStores.length) : 0,
    partnerCount: mallTenants.length,
    storeCount: mallStores.length,
    occupiedCount: occupiedStores.length,
  };
}
