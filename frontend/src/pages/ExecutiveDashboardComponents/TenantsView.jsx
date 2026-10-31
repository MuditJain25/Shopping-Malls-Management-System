import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";

import {
  PageHeader,
  DataTable,
  Badge,
  LoadingSpinner,
  ErrorState,
} from "@/components/ui/index.jsx";

import Modal from "@/components/ui/Modal.jsx";

import {
  apiGetTenants,
  apiGetMalls,
  apiGetStores,
  apiCreateTenant,
  apiUpdateTenant,
  apiDeleteTenant,
} from "@/lib/api.js";

const EMPTY_FORM = {
  business_name: "",
  business_type: "",
  email: "",
  phone_number: "",
  mall_id: "",
  store_id: "",
};

export default function TenantsView() {
  const [tenants, setTenants] = useState(null);
  const [malls, setMalls] = useState([]);
  const [stores, setStores] = useState([]);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const [showAdd, setShowAdd] = useState(false);
  const [tenantToEdit, setTenantToEdit] = useState(null);
  const [tenantToRemove, setTenantToRemove] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setError(null);

    Promise.all([
      apiGetTenants(),
      apiGetMalls().catch(() => []),
      apiGetStores().catch(() => []),
    ])
      .then(([allTenants, allMalls, allStores]) => {
        if (!cancelled) {
          setTenants(allTenants);
          setMalls(allMalls);
          setStores(allStores);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const mallById = (id) =>
    malls.find((mall) => String(mall.mall_id) === String(id));

  const storeById = (id) =>
    stores.find((store) => String(store.store_id) === String(id));

  const getTenantStore = (tenant) =>
    (tenant.store_ids || []).map(storeById).find(Boolean);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const openAddModal = () => {
    setTenantToEdit(null);
    setForm({ ...EMPTY_FORM });
    setActionError(null);
    setShowAdd(true);
  };

  const openEditModal = (tenant) => {
    const store = getTenantStore(tenant);

    setTenantToEdit(tenant);
    setForm({
      business_name: tenant.business_name || "",
      business_type: tenant.business_type || "",
      email: tenant.email || "",
      phone_number: tenant.phone_number || "",
      mall_id: store ? String(store.mall_id) : "",
      store_id: store ? String(store.store_id) : "",
    });
    setActionError(null);
    setShowAdd(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (saving) return;

    setActionError(null);
    setSaving(true);

    const tenantData = {
      business_name: form.business_name.trim(),
      business_type: form.business_type.trim(),
      email: form.email.trim(),
      phone_number: form.phone_number.trim(),
      store_ids: form.store_id ? [Number(form.store_id)] : [],
    };

    try {
      if (tenantToEdit) {
        await apiUpdateTenant(tenantToEdit.tenant_id, tenantData);
      } else {
        await apiCreateTenant(tenantData);
      }

      setForm({ ...EMPTY_FORM });
      setShowAdd(false);
      setTenantToEdit(null);
      setRefresh((current) => current + 1);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!tenantToRemove || deleting) return;

    setActionError(null);
    setDeleting(true);

    try {
      await apiDeleteTenant(tenantToRemove.tenant_id);

      setTenantToRemove(null);
      setRefresh((current) => current + 1);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (error) return <ErrorState message={error} />;

  if (!tenants) {
    return <LoadingSpinner label="Loading tenants..." />;
  }

  const availableStores = stores.filter((store) => {
    const matchesMall =
      !form.mall_id || String(store.mall_id) === String(form.mall_id);

    const isAvailable = store.status === "available";
    const isCurrentStore =
      tenantToEdit && String(store.store_id) === String(form.store_id);

    return matchesMall && (isAvailable || isCurrentStore);
  });

  const closeAddModal = () => {
    if (saving) return;

    setShowAdd(false);
    setTenantToEdit(null);
    setActionError(null);
  };

  const closeRemoveModal = () => {
    if (deleting) return;

    setTenantToRemove(null);
    setActionError(null);
  };

  return (
    <div>
      <PageHeader
        title="All Tenants"
        subtitle="All tenants across all malls"
        action={
          <button onClick={openAddModal} className="btn-primary text-sm">
            <Plus size={16} />
            Add Tenant
          </button>
        }
      />

      <div className="card overflow-hidden">
        <DataTable
          columns={[
            {
              key: "business_name",
              label: "Business",
              render: (tenant) => (
                <span className="font-medium text-slate-800">
                  {tenant.business_name}
                </span>
              ),
            },
            {
              key: "business_type",
              label: "Type",
              render: (tenant) => (
                <Badge variant="brand">{tenant.business_type}</Badge>
              ),
            },
            {
              key: "mall",
              label: "Mall",
              render: (tenant) => {
                const store = (tenant.store_ids || [])
                  .map(storeById)
                  .find(Boolean);

                const mall = store ? mallById(store.mall_id) : null;

                return (
                  <span className="text-slate-600">
                    {mall
                      ? mall.mall_name || `${mall.city}, ${mall.state}`
                      : "—"}
                  </span>
                );
              },
            },
            {
              key: "stores",
              label: "Store",
              render: (tenant) => {
                const store = (tenant.store_ids || [])
                  .map(storeById)
                  .find(Boolean);

                return (
                  <span className="text-slate-600">
                    {store
                      ? `${store.store_name} · Shop ${store.shop_number}`
                      : `${(tenant.store_ids || []).length} store(s)`}
                  </span>
                );
              },
            },
            {
              key: "email",
              label: "Email",
              render: (tenant) => (
                <span className="text-slate-600">{tenant.email}</span>
              ),
            },
            {
              key: "phone",
              label: "Phone",
              render: (tenant) => (
                <span className="text-slate-600">{tenant.phone_number}</span>
              ),
            },
            {
              key: "registered",
              label: "Registered",
              render: (tenant) => (
                <span className="text-slate-500">{tenant.date_registered}</span>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              render: (tenant) => (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(tenant)}
                    disabled={saving || deleting}
                    className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                    title="Update tenant"
                    aria-label={`Update ${tenant.business_name}`}
                  >
                    <Pencil size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActionError(null);
                      setTenantToRemove(tenant);
                    }}
                    disabled={saving || deleting}
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-50"
                    title="Remove tenant"
                    aria-label={`Remove ${tenant.business_name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ),
            },
          ]}
          rows={tenants}
          emptyMessage="No tenants found."
        />
      </div>

      <Modal
        open={showAdd}
        onClose={closeAddModal}
        title={tenantToEdit ? "Update Tenant" : "Add Tenant"}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Business Name</label>
            <input
              required
              className="input"
              value={form.business_name}
              onChange={(e) => updateField("business_name", e.target.value)}
            />
          </div>

          <div>
            <label className="label">Business Type</label>
            <input
              required
              className="input"
              value={form.business_type}
              onChange={(e) => updateField("business_type", e.target.value)}
              placeholder="e.g. Fashion Retail"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Email</label>
              <input
                required
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>

            <div>
              <label className="label">Phone Number</label>
              <input
                className="input"
                value={form.phone_number}
                onChange={(e) => updateField("phone_number", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Mall</label>
            <select
              className="input"
              value={form.mall_id}
              onChange={(e) => {
                setForm((current) => ({
                  ...current,
                  mall_id: e.target.value,
                  store_id: "",
                }));
              }}
            >
              <option value="">Any / Unassigned</option>
              {malls.map((mall) => (
                <option key={mall.mall_id} value={mall.mall_id}>
                  {mall.mall_name || `${mall.city}, ${mall.state}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Assign Store</label>
            <select
              className="input"
              value={form.store_id}
              onChange={(e) => updateField("store_id", e.target.value)}
            >
              <option value="">No store yet</option>
              {availableStores.map((store) => (
                <option key={store.store_id} value={store.store_id}>
                  {store.store_name} — Shop {store.shop_number} (
                  {mallById(store.mall_id)?.mall_name || store.mall_id})
                </option>
              ))}
            </select>
          </div>

          {actionError && <ErrorState message={actionError} />}

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? tenantToEdit
                ? "Updating..."
                : "Creating..."
              : tenantToEdit
                ? "Update Tenant"
                : "Create Tenant"}
          </button>
        </form>
      </Modal>

      <Modal
        open={!!tenantToRemove}
        onClose={closeRemoveModal}
        title="Remove Tenant"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Remove{" "}
            <span className="font-medium text-slate-800">
              {tenantToRemove?.business_name}
            </span>
            ?
          </p>

          {actionError && <ErrorState message={actionError} />}

          <div className="flex gap-3">
            <button
              onClick={closeRemoveModal}
              disabled={deleting}
              className="btn-secondary flex-1 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              onClick={handleRemove}
              disabled={deleting}
              className="btn flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? "Removing..." : "Remove"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
