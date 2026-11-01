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
- Revenue UI (`RevenueView.jsx`) still reads mock data and has an amount field; the API stores
  `description` only (pending P2).
