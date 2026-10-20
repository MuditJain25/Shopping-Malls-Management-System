// ═══════════════════════════════════════════════════════════════
// API CLIENT — Spring Boot Backend Integration
// ═══════════════════════════════════════════════════════════════
//
// API client for the Spring Boot backend. Auth login/signup and mall analytics
// are still mocked because the backend has no matching endpoints; everything
// else calls the API directly.
//
// Set VITE_API_BASE_URL in .env (default http://localhost:8080/api).
//
// The Spring Boot backend exposes these REST endpoints (mirrors
// com.mallhub.controller):
//
// ── Auth ────────────────────────────────────────────────────────
//   POST   /api/auth/google → { id_token } → { token, user }
//   GET    /api/auth/me → current user
//   POST   /api/auth/logout → { success }
//   GET    /api/health → { status }
//
// ── Malls ───────────────────────────────────────────────────────
//   GET    /api/malls?q=&city= → Mall[]
//   GET    /api/malls/{id} → Mall
//   GET    /api/malls/{id}/stores → Store[]
//   GET    /api/malls/nearest?lat=&lng=&limit= → Mall[]
//   GET    /api/malls/{id}/products/top?storeId= → Product[]
//   GET    /api/malls/{id}/manager → MallManager|null
//   GET    /api/malls/{id}/employees?storeId= → Employee[]
//   GET    /api/malls/{id}/bid-events?status= → BidEvent[]
//   GET    /api/malls/{id}/offers → Offer[]
//
// ── Stores ──────────────────────────────────────────────────────
//   GET    /api/stores?mallId=&status= → Store[]
//   GET    /api/stores/available?mallId= → Store[]
//   GET    /api/stores/{id} → Store
//   POST   /api/stores → Store 201
//   PUT    /api/stores/{id} → Store
//   DELETE /api/stores/{id} → 204
//   GET    /api/stores/{id}/products → Product[]
//   POST   /api/stores/{id}/products/{productId} → Product 201
//   PUT    /api/stores/{id}/products/{pid} → { to_show }
//   GET    /api/stores/{id}/employees → Employee[]
//   GET    /api/stores/{id}/offers → Offer[]
//   POST   /api/stores/{id}/offers → Offer 201
//   PUT    /api/stores/{id}/offers/{oid} → Offer
//   DELETE /api/stores/{id}/offers/{oid} → 204
//
// ── Products ────────────────────────────────────────────────────
//   GET    /api/products?search= → Product[]
//   GET    /api/products/{id} → Product
//   POST   /api/products → Product 201
//
// ── Bid events & bids ───────────────────────────────────────────
//   GET    /api/bid-events?status= → BidEvent[]
//   GET    /api/bid-events/{id} → BidEvent
//   POST   /api/bid-events → BidEvent 201
//   GET    /api/bid-events/{id}/bids → Bid[]
//   GET    /api/bids?userId= → Bid[]
//   POST   /api/bid-events/{id}/bids → Bid
//   PUT    /api/bid-events/{id}/finalize → finalize winning bid
//
// ── Tenants ─────────────────────────────────────────────────────
//   GET    /api/tenants?mallId= → Tenant[]
//   GET    /api/tenants/{id} → Tenant
//   POST   /api/tenants → Tenant 201
//   DELETE /api/tenants/{id} → 204
//   GET    /api/tenants/{id}/stores → Store[]
//   GET    /api/tenants/{id}/employees → Employee[]
//   POST   /api/tenants/{id}/employees → Employee 201
//   GET    /api/tenants/{id}/transactions → FinancialTransaction[]
//   GET    /api/tenants/{id}/revenue → Revenue[]
//   POST   /api/tenants/{id}/revenue → Revenue 201
//
// ── Employees ───────────────────────────────────────────────────
//   POST   /api/employees → Employee 201
//   GET    /api/employees/{id} → Employee
//   DELETE /api/employees/{id} → 204
//   GET    /api/employees/{id}/leave-requests → LeaveRequest[]
//   POST   /api/employees/{id}/leave-requests → LeaveRequest 201
//   PATCH  /api/employees/{id}/leave-requests/{rid} → LeaveRequest
//   GET    /api/leave-requests?storeId=&status= → LeaveRequest[]
//   GET    /api/employees/{id}/payroll → PayrollRecord[]
//   GET    /api/employees/{id}/attendance → Attendance[]
//   POST   /api/employees/{id}/attendance/check-in
//   POST   /api/employees/{id}/attendance/check-out
//
// ── Managers / executives / transactions ────────────────────────
//   GET    /api/managers → MallManager[]
//   GET    /api/managers/{id} → MallManager
//   POST   /api/managers → MallManager 201
//   GET    /api/executives/{id} → EnterpriseExecutive
//   GET    /api/executives/{id}/malls → Mall[]
//   GET    /api/transactions?mallId= → FinancialTransaction[]
// ═══════════════════════════════════════════════════════════════

import * as mock from "./mockData.js";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

function getAuthHeaders() {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...options.headers },
  });
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

// ── Shape helpers ────────────────────────────────────────────────
// Backend returns camelCase + integer ids; the UI was built on the
// mockData.js snake_case shape. Normalize once here so pages don't
// have to handle both shapes. Paged endpoints return a bare array
// unless ?page= was sent (see Paging.shape), so unwrap both.
function unwrap(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.content)) return data.content;
  return data ?? [];
}

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeMall(m) {
  if (!m) return m;
  return {
    ...m,
    mall_id: m.mallId ?? m.mall_id,
    mall_name: m.mall_name ?? m.street ?? `${m.city ?? "Mall"}`,
    city: m.city,
    state: m.state,
    imageUrl: m.imageUrl,
    description: m.description,
  };
}

function normalizeStore(s) {
  if (!s) return s;
  const media = s.listing_media ?? s.listingMedia;
  return {
    ...s,
    store_id: s.storeId ?? s.store_id,
    mall_id: s.mallId ?? s.mall_id,
    store_name: s.storeName ?? s.store_name,
    shop_number: s.shopNumber ?? s.shop_number,
    area_sqft: s.areaSqft ?? s.area_sqft,
    status: s.status,
    floor: s.floor,
    listing_media: Array.isArray(media) ? media : media ? [media] : [],
  };
}

function normalizeProduct(p) {
  if (!p) return p;
  return {
    ...p,
    product_id: p.productId ?? p.product_id,
    product_name: p.productName ?? p.product_name,
    category: p.category,
    price: toNum(p.price ?? 0),
    imageUrl: p.imageUrl ?? p.image_url,
    store: p.store ? normalizeStore(p.store) : p.store,
  };
}

function normalizeBid(b) {
  if (!b) return b;
  return {
    ...b,
    bid_id: b.bidId ?? b.bid_id,
    user_id: b.userId ?? b.user_id,
    event_id: b.eventId ?? b.event_id,
    store_id: b.storeId ?? b.store_id,
    bid_amount: toNum(b.bidAmount ?? b.bid_amount ?? 0),
    round_number: b.roundNumber ?? b.round_number,
    bid_date: b.bidDate ?? b.bid_date,
    status: b.status,
    bidder_name: b.bidderName ?? b.bidder_name,
  };
}

function normalizeBidEvent(e) {
  if (!e) return e;
  const winning = e.winningBid ?? e.winning_bid ?? null;
  return {
    ...e,
    event_id: e.eventId ?? e.event_id,
    store_id: e.storeId ?? e.store_id,
    status: e.status,
    minimum_bid_amount: toNum(e.minimumBidAmount ?? e.minimum_bid_amount ?? 0),
    minimum_bid_increment: toNum(
      e.minimumBidIncrement ?? e.minimum_bid_increment ?? 0,
    ),
    final_allocation: e.finalAllocation ?? e.final_allocation ?? null,
    winningBid: winning ? normalizeBid(winning) : null,
  };
}

// ── Auth ────────────────────────────────────────────────────────
export async function apiLogin(email, password) {
  // return apiFetch('/auth/login', {
  //   method: 'POST',
  //   body: JSON.stringify({ email, password }),
  // });

  // MOCK: check against demo users
  const user = mock.demoUsers.find(
    (u) => u.email === email && u.password === password,
  );
  if (!user) throw new Error("Invalid email or password");
  const { password: _pw, ...userWithoutPw } = user;
  return userWithoutPw;
}

export async function apiSignup({
  firstName,
  lastName,
  email,
  password,
  role,
}) {
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
  return apiFetch("/auth/logout", { method: "POST" });
}

export async function apiGoogleLogin(idToken) {
  return apiFetch("/auth/google", {
    method: "POST",
    body: JSON.stringify({ id_token: idToken }),
  });
}

export async function apiGetCurrentUser() {
  return apiFetch("/auth/me");
}

export async function apiHealth() {
  return apiFetch("/health");
}

// ── Malls ──────────────────────────────────────────────────────
export async function apiGetMalls(q, city) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (city) params.set("city", city);
  const qs = params.toString() ? `?${params}` : "";
  const data = await apiFetch(`/malls${qs}`);
  return unwrap(data).map(normalizeMall);
}

export async function apiGetMallById(id) {
  const data = await apiFetch(`/malls/${id}`);
  return normalizeMall(data);
}

export async function apiGetNearestMalls(lat, lng, limit = 5) {
  const params = new URLSearchParams({ lat, lng, limit });
  const data = await apiFetch(`/malls/nearest?${params}`);
  return unwrap(data).map(normalizeMall);
}

export async function apiGetMallOffers(mallId) {
  const data = await apiFetch(`/malls/${mallId}/offers`);
  return unwrap(data);
}

// ── Stores ─────────────────────────────────────────────────────
export async function apiGetStores(mallId, status) {
  const params = new URLSearchParams();
  if (mallId) params.set("mallId", mallId);
  if (status) params.set("status", status);
  const qs = params.toString() ? `?${params}` : "";
  const data = await apiFetch(`/stores${qs}`);
  return unwrap(data).map(normalizeStore);
}

export async function apiGetStoresByMall(mallId) {
  const data = await apiFetch(`/malls/${mallId}/stores`);
  return unwrap(data).map(normalizeStore);
}

export async function apiGetAvailableStores(mallId) {
  const qs = mallId ? `?mallId=${encodeURIComponent(mallId)}` : "";
  const data = await apiFetch(`/stores/available${qs}`);
  return unwrap(data).map(normalizeStore);
}

export async function apiGetStoreById(id) {
  const data = await apiFetch(`/stores/${id}`);
  return normalizeStore(data);
}

export async function apiCreateStore(storeData) {
  const data = await apiFetch("/stores", {
    method: "POST",
    body: JSON.stringify(storeData),
  });
  return normalizeStore(data);
}

export async function apiUpdateStore(id, storeData) {
  const data = await apiFetch(`/stores/${id}`, {
    method: "PUT",
    body: JSON.stringify(storeData),
  });
  return normalizeStore(data);
}

export async function apiDeleteStore(id) {
  return apiFetch(`/stores/${id}`, { method: "DELETE" });
}

export async function apiAttachProduct(storeId, productId, toShow) {
  return apiFetch(`/stores/${storeId}/products/${productId}`, {
    method: "POST",
    ...(toShow === undefined
      ? {}
      : { body: JSON.stringify({ to_show: toShow }) }),
  });
}

export async function apiGetStoreOffers(storeId) {
  const data = await apiFetch(`/stores/${storeId}/offers`);
  return unwrap(data);
}

export async function apiCreateOffer(storeId, offerData) {
  return apiFetch(`/stores/${storeId}/offers`, {
    method: "POST",
    body: JSON.stringify(offerData),
  });
}

export async function apiUpdateOffer(storeId, offerId, offerData) {
  return apiFetch(`/stores/${storeId}/offers/${offerId}`, {
    method: "PUT",
    body: JSON.stringify(offerData),
  });
}

export async function apiDeleteOffer(storeId, offerId) {
  return apiFetch(`/stores/${storeId}/offers/${offerId}`, {
    method: "DELETE",
  });
}

// ── Products ───────────────────────────────────────────────────
export async function apiGetProducts(search) {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  const data = await apiFetch(`/products${qs}`);
  return unwrap(data).map(normalizeProduct);
}

export async function apiGetProductById(id) {
  return normalizeProduct(await apiFetch(`/products/${id}`));
}

export async function apiCreateProduct(productData) {
  const data = await apiFetch("/products", {
    method: "POST",
    body: JSON.stringify(productData),
  });
  return normalizeProduct(data);
}

export async function apiGetProductsByStore(storeId) {
  return apiFetch(`/stores/${storeId}/products`);
}

export async function apiGetTopSellingProducts(mallId, storeId) {
  const qs = storeId ? `?storeId=${encodeURIComponent(storeId)}` : "";
  const data = await apiFetch(`/malls/${mallId}/products/top${qs}`);
  return unwrap(data).map(normalizeProduct);
}

export async function apiToggleProductVisibility(storeId, productId, toShow) {
  return apiFetch(`/stores/${storeId}/products/${productId}`, {
    method: "PUT",
    body: JSON.stringify({ to_show: toShow }),
  });
}

// ── Bid Events & Bids ──────────────────────────────────────────
export async function apiGetBidEvents(status) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const data = await apiFetch(`/bid-events${qs}`);
  return unwrap(data).map(normalizeBidEvent);
}

export async function apiGetBidEventsByMall(mallId, status) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const data = await apiFetch(`/malls/${mallId}/bid-events${qs}`);
  return unwrap(data).map(normalizeBidEvent);
}

export async function apiGetBidEventById(eventId) {
  const data = await apiFetch(`/bid-events/${eventId}`);
  return normalizeBidEvent(data);
}

export async function apiGetBidsByEvent(eventId) {
  const data = await apiFetch(`/bid-events/${eventId}/bids`);
  return unwrap(data).map(normalizeBid);
}

export async function apiGetBidsByUser(userId) {
  const qs = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  const data = await apiFetch(`/bids${qs}`);
  return unwrap(data).map(normalizeBid);
}

export async function apiPlaceBid(eventId, userId, bidAmount, bidderName) {
  const uid = Number(userId);
  if (!Number.isInteger(uid)) {
    throw new Error(
      "Sign in with a backend account to bid (demo users have no numeric id)",
    );
  }
  const data = await apiFetch(`/bid-events/${eventId}/bids`, {
    method: "POST",
    body: JSON.stringify({
      user_id: uid,
      bid_amount: bidAmount,
      bidder_name: bidderName,
    }),
  });
  return normalizeBid(data);
}

export async function apiFinalizeBidEvent(eventId, allocation) {
  const data = await apiFetch(`/bid-events/${eventId}/finalize`, {
    method: "PUT",
    body: JSON.stringify({ final_allocation: allocation }),
  });
  return normalizeBidEvent(data);
}

export async function apiCreateBidEvent(eventData) {
  const data = await apiFetch("/bid-events", {
    method: "POST",
    body: JSON.stringify(eventData),
  });
  return normalizeBidEvent(data);
}

// ── Tenants ────────────────────────────────────────────────────
export async function apiGetTenants(mallId) {
  const qs = mallId ? `?mallId=${encodeURIComponent(mallId)}` : "";
  const data = await apiFetch(`/tenants${qs}`);
  return unwrap(data);
}

export async function apiGetTenantById(id) {
  return apiFetch(`/tenants/${id}`);
}

export async function apiCreateTenant(tenantData) {
  return apiFetch("/tenants", {
    method: "POST",
    body: JSON.stringify(tenantData),
  });
}

export async function apiDeleteTenant(id) {
  return apiFetch(`/tenants/${id}`, { method: "DELETE" });
}

export async function apiGetStoresByTenant(tenantId) {
  return apiFetch(`/tenants/${tenantId}/stores`);
}

export async function apiGetEmployeesByTenant(tenantId) {
  return apiFetch(`/tenants/${tenantId}/employees`);
}

export async function apiGetEmployeesByStore(storeId) {
  const data = await apiFetch(`/stores/${storeId}/employees`);
  return unwrap(data);
}

// Creates an employee assigned to a store.
// Store-less employee creation is not supported by the backend yet.
export async function apiAddStoreEmployee(tenantId, employeeData) {
  return apiFetch(`/tenants/${tenantId}/employees`, {
    method: "POST",
    body: JSON.stringify(employeeData),
  });
}

// Backend does not yet support creating store-less employees.
export async function apiAddEmployee(employeeData) {
  return apiFetch("/employees", {
    method: "POST",
    body: JSON.stringify(employeeData),
  });
}

export async function apiDeleteEmployee(id) {
  return apiFetch(`/employees/${id}`, { method: "DELETE" });
}

export async function apiGetRevenueByTenant(tenantId) {
  const data = await apiFetch(`/tenants/${tenantId}/revenue`);
  return unwrap(data);
}

export async function apiSubmitRevenue(tenantId, { description }) {
  return apiFetch(`/tenants/${tenantId}/revenue`, {
    method: "POST",
    body: JSON.stringify({ description }),
  });
}

export async function apiGetTransactionsByTenant(tenantId) {
  return apiFetch(`/tenants/${tenantId}/transactions`);
}

export async function apiGetTransactionsByMall(mallId) {
  const qs = mallId ? `?mallId=${encodeURIComponent(mallId)}` : "";
  const data = await apiFetch(`/transactions${qs}`);
  return unwrap(data);
}

// ── Mall Employees ─────────────────────────────────────────────
export async function apiGetEmployeesByMall(mallId, storeId) {
  const qs = storeId ? `?storeId=${encodeURIComponent(storeId)}` : "";
  const data = await apiFetch(`/malls/${mallId}/employees${qs}`);
  return unwrap(data);
}

// ── Mall Managers ──────────────────────────────────────────────
export async function apiGetManagers() {
  const data = await apiFetch("/managers");
  return unwrap(data);
}

export async function apiGetManagerById(id) {
  return apiFetch(`/managers/${id}`);
}

export async function apiGetManagerByMall(mallId) {
  return apiFetch(`/malls/${mallId}/manager`);
}

export async function apiCreateManager(managerData) {
  return apiFetch("/managers", {
    method: "POST",
    body: JSON.stringify(managerData),
  });
}

// ── Executives ─────────────────────────────────────────────────
export async function apiGetExecutiveById(id) {
  return apiFetch(`/executives/${id}`);
}

export async function apiGetExecutiveMalls(id) {
  const data = await apiFetch(`/executives/${id}/malls`);
  return unwrap(data).map(normalizeMall);
}

// ── Employee Self-Service ──────────────────────────────────────
// Backend responses are snake_case (Jackson SNAKE_CASE) and key the
// employee foreign key as employee_id; the UI expects e_id, so map it.
export async function apiGetEmployeeById(id) {
  return apiFetch(`/employees/${id}`);
}

export async function apiGetLeaveRequests(empId) {
  const data = await apiFetch(`/employees/${empId}/leave-requests`);
  return unwrap(data).map((r) => ({ ...r, e_id: r.e_id ?? r.employee_id }));
}

export async function apiApplyLeave(empId, { start_date, end_date, reason }) {
  return apiFetch(`/employees/${empId}/leave-requests`, {
    method: "POST",
    body: JSON.stringify({ start_date, end_date, reason }),
  });
}

export async function apiGetStoreLeaveRequests(storeId, status) {
  const params = new URLSearchParams({ storeId });
  if (status) params.set("status", status);
  const data = await apiFetch(`/leave-requests?${params}`);
  return unwrap(data).map((r) => ({ ...r, e_id: r.e_id ?? r.employee_id }));
}

export async function apiDecideLeave(empId, requestId, status) {
  return apiFetch(`/employees/${empId}/leave-requests/${requestId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function apiGetPayroll(empId) {
  const data = await apiFetch(`/employees/${empId}/payroll`);
  return unwrap(data).map((r) => ({ ...r, e_id: r.e_id ?? r.employee_id }));
}

export async function apiGetAttendance(empId) {
  const data = await apiFetch(`/employees/${empId}/attendance`);
  return unwrap(data).map((r) => ({ ...r, e_id: r.e_id ?? r.employee_id }));
}

export async function apiCheckIn(empId) {
  return apiFetch(`/employees/${empId}/attendance/check-in`, {
    method: "POST",
  });
}

export async function apiCheckOut(empId) {
  return apiFetch(`/employees/${empId}/attendance/check-out`, {
    method: "POST",
  });
}

// ── Analytics ─────────────────────────────────────────────────
export async function apiGetMallAnalytics(mallId) {
  // return apiFetch(`/analytics/mall/${mallId}`);
  // MOCK: compute from mock data
  const mallStores = mock.getStoresByMall(mallId);
  const occupiedStores = mallStores.filter((s) => s.status === "occupied");
  const mall = mock.malls.find((m) => m.mall_id === mallId);
  const mallName = mall
    ? mall.city === "New York"
      ? "Heritage Plaza Mall"
      : mall.city === "San Jose"
        ? "Tech Park Mall"
        : "Lakeshore Mall"
    : "";
  const mallTransactions = mock.transactions.filter(
    (t) => t.receiver === mallName,
  );
  const totalRevenue = mallTransactions.reduce((sum, t) => sum + t.amount, 0);
  const mallTenants = mock.tenants.filter((t) =>
    t.store_ids.some((sid) => mallStores.some((s) => s.store_id === sid)),
  );
  return {
    totalRevenue,
    customerCount:
      12500 + (mallId === "m1" ? 3200 : mallId === "m2" ? 2100 : 1800),
    avgRevenuePerStore: occupiedStores.length
      ? Math.round(totalRevenue / occupiedStores.length)
      : 0,
    partnerCount: mallTenants.length,
    storeCount: mallStores.length,
    occupiedCount: occupiedStores.length,
  };
}
