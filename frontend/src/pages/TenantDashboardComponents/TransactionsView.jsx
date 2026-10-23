import { useEffect, useState } from "react";
import { PageHeader, DataTable } from "@/components/ui/index.jsx";
import { apiGetTransactionsByTenant } from "@/lib/api";
import { getTransactionsByTenant, tenants } from "@/lib/mockData.js";

function getTenantByStore(store) {
  return tenants.find((t) => t.store_ids.includes(store.store_id));
}

export default function TransactionsView({ tenantId, isShopManager, stores }) {
  const [tenantTransactions, setTenantTransactions] = useState([]);

  useEffect(() => {
    if (isShopManager || tenantId == null) return;

    let cancelled = false;

    apiGetTransactionsByTenant(tenantId)
      .then((data) => {
        if (!cancelled) {
          const transactionList = Array.isArray(data)
            ? data
            : (data?.content ?? data?.items ?? []);

          setTenantTransactions(transactionList);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to load tenant transactions:", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isShopManager, tenantId]);

  const displayTransactions = isShopManager
    ? stores.flatMap((s) => {
        const tenant = getTenantByStore(s);

        return tenant ? getTransactionsByTenant(tenant.tenant_id) : [];
      })
    : tenantTransactions;

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="Store transaction history with the mall"
      />
      <div className="card overflow-hidden">
        <DataTable
          columns={[
            {
              key: "transaction_id",
              label: "ID",
              render: (t) => (
                <span className="text-slate-400 font-mono text-xs">
                  {t.transaction_id}
                </span>
              ),
            },
            {
              key: "sender",
              label: "From",
              render: (t) => (
                <span className="font-medium text-slate-800">{t.sender}</span>
              ),
            },
            {
              key: "receiver",
              label: "To",
              render: (t) => (
                <span className="text-slate-600">{t.receiver}</span>
              ),
            },
            {
              key: "amount",
              label: "Amount",
              render: (t) => (
                <span className="font-semibold text-green-600">
                  ${t.amount.toLocaleString()}
                </span>
              ),
            },
            {
              key: "date",
              label: "Date",
              render: (t) => (
                <span className="text-slate-500">{t.transaction_date}</span>
              ),
            },
            {
              key: "remarks",
              label: "Remarks",
              render: (t) => (
                <span className="text-slate-500 text-xs">{t.remarks}</span>
              ),
            },
          ]}
          rows={displayTransactions}
          emptyMessage="No transactions recorded yet."
        />
      </div>
    </div>
  );
}
