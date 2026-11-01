Make the backend

## Frontend follow-ups (after backend)

- `GET /api/transactions?mallId=` was removed: `sender`/`receiver` are raw account values, so a
  mall cannot be matched from them. The server now ignores the param and returns every row, so
  per-mall figures are wrong until the callers are changed:
  - `MallManagerDashboardComponents/TransactionsView.jsx`
  - `ExecutiveDashboardComponents/AnalyticsView.jsx`
  - `apiGetTransactionsByMall` in `frontend/src/lib/api.js` is obsolete.
- `GET /api/tenants/{id}/transactions` still matches `sender = business_name`: the same
  account-number problem (pending P5, `receiver_mall_id` / owner column).
- Executive `Overview.jsx`, `MallsView.jsx` and `AnalyticsView.jsx` still fetch whole lists and use `.length`;
  switch to `apiGetCounts` (`GET /api/counts`, `groupBy=mall` for per-mall figures).
- Mall-manager "Add Tenant" sends `store_ids`, but `TenantCreateRequest` has no such field, so the
  "Assign Store" dropdown is ignored; use "Manage tenants" on the Stores tab to link.
- Link/unlink does not touch `store.status` (available/occupied), so bidding and
  `GET /stores/available` can still show a store that has a tenant. To be discussed with bidding.
- Revenue UI (`RevenueView.jsx`) still reads mock data and has an amount field; the API stores
  `description` only (pending P2).
