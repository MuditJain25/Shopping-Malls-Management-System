import { useState, useEffect } from "react";
import { Plus, CheckCircle2 } from "lucide-react";

import {
  PageHeader,
  DataTable,
  LoadingSpinner,
  ErrorState,
} from "@/components/ui/index.jsx";

import { apiGetMalls, apiGetManagers, apiCreateManager } from "@/lib/api.js";

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  mall_id: "",
};

export default function CreateManagerView() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [malls, setMalls] = useState([]);
  const [managers, setManagers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [created, setCreated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [mallData, managerData] = await Promise.all([
          apiGetMalls(),
          apiGetManagers(),
        ]);

        if (cancelled) return;

        setMalls(mallData);
        setManagers(managerData);

        if (mallData.length > 0) {
          setForm((previous) => ({
            ...previous,
            mall_id: previous.mall_id || String(mallData[0].mall_id),
          }));
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err.message || "Failed to load managers and malls.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!created) return;

    const timeoutId = setTimeout(() => {
      setCreated(false);
    }, 4000);

    return () => clearTimeout(timeoutId);
  }, [created]);

  const handleCreate = async (event) => {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setActionError(null);
    setCreated(false);

    try {
      const managerData = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number.trim(),
        mall_id: Number(form.mall_id),
      };

      const newManager = await apiCreateManager(managerData);

      if (newManager) {
        setManagers((previous) => [...previous, newManager]);
      }

      setForm({
        ...EMPTY_FORM,
        mall_id: malls.length ? String(malls[0].mall_id) : "",
      });

      setCreated(true);
    } catch (err) {
      setActionError(err.message || "Failed to create manager account.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading managers and malls..." />;
  }

  if (loadError) {
    return <ErrorState message={loadError} />;
  }

  return (
    <div>
      <PageHeader
        title="Create New Manager"
        subtitle="Add a new Mall Manager account with admin powers"
      />

      {created && (
        <div className="card p-3 mb-4 bg-green-50 border-green-200 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-green-600" />
          <span className="text-sm text-green-700">
            Manager account created successfully!
          </span>
        </div>
      )}

      {actionError && (
        <div
          role="alert"
          className="card p-3 mb-4 bg-red-50 border-red-200 text-sm text-red-700"
        >
          {actionError}
        </div>
      )}

      <div className="card p-5 max-w-xl">
        <form onSubmit={handleCreate}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="manager-first-name">
                  First Name
                </label>
                <input
                  id="manager-first-name"
                  className="input"
                  value={form.first_name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      first_name: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="label" htmlFor="manager-last-name">
                  Last Name
                </label>
                <input
                  id="manager-last-name"
                  className="input"
                  value={form.last_name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      last_name: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="manager-email">
                Email
              </label>
              <input
                id="manager-email"
                type="email"
                className="input"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="manager-phone">
                Phone Number
              </label>
              <input
                id="manager-phone"
                type="tel"
                className="input"
                value={form.phone_number}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone_number: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="label" htmlFor="manager-mall">
                Assign to Mall
              </label>
              <select
                id="manager-mall"
                className="input"
                value={form.mall_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    mall_id: e.target.value,
                  })
                }
                required
                disabled={malls.length === 0}
              >
                {malls.length === 0 && (
                  <option value="">No malls available</option>
                )}

                {malls.map((mall) => (
                  <option key={mall.mall_id} value={String(mall.mall_id)}>
                    {mall.mall_name || mall.city || "Mall"}
                    {mall.city ? ` — ${mall.city}, ${mall.state}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={saving || malls.length === 0}
              className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              {saving ? "Creating Manager..." : "Create Manager Account"}
            </button>
          </div>
        </form>
      </div>

      <h3 className="font-semibold text-slate-900 mt-8 mb-3">
        Existing Managers
      </h3>

      <div className="card overflow-hidden">
        <DataTable
          columns={[
            {
              key: "name",
              label: "Name",
              render: (manager) => (
                <span className="font-medium text-slate-800">
                  {manager.first_name} {manager.last_name}
                </span>
              ),
            },
            {
              key: "email",
              label: "Email",
              render: (manager) => (
                <span className="text-slate-600">{manager.email}</span>
              ),
            },
            {
              key: "mall",
              label: "Mall",
              render: (manager) => {
                const mall = malls.find(
                  (item) => String(item.mall_id) === String(manager.mall_id),
                );

                return (
                  <span className="text-slate-600">{mall?.city || "N/A"}</span>
                );
              },
            },
            {
              key: "joined",
              label: "Joined",
              render: (manager) => (
                <span className="text-slate-500">
                  {manager.date_joined || "N/A"}
                </span>
              ),
            },
          ]}
          rows={managers}
          emptyMessage="No managers found."
        />
      </div>
    </div>
  );
}
