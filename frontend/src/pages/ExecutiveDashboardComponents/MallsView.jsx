import { useState, useEffect } from "react";
import { Plus, Trash2, Building2, Store } from "lucide-react";

import {
  PageHeader,
  DataTable,
  LoadingSpinner,
  ErrorState,
} from "@/components/ui/index.jsx";

import Modal from "@/components/ui/Modal.jsx";

import {
  apiGetMalls,
  apiGetManagers,
  apiGetStores,
  apiCreateMall,
  apiDeleteMall,
} from "@/lib/api.js";

const EMPTY_MALL = {
  city: "",
  state: "",
  street: "",
  pincode: "",
  mall_area_sqft: "",
  opening_date: "",
  latitude: "",
  longitude: "",
  image_url: "",
  description: "",
};

export default function MallsView() {
  const [malls, setMalls] = useState([]);
  const [managers, setManagers] = useState([]);
  const [stores, setStores] = useState([]);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_MALL);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingMallId, setDeletingMallId] = useState(null);

  const [mallToDelete, setMallToDelete] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [formError, setFormError] = useState("");

  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setLoadError("");

      try {
        const [mallData, managerData, storeData] = await Promise.all([
          apiGetMalls(),
          apiGetManagers().catch(() => []),
          apiGetStores().catch(() => []),
        ]);

        if (cancelled) return;

        setMalls(mallData);
        setManagers(managerData);
        setStores(storeData);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err.message || "Failed to load malls.");
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
  }, [refresh]);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const getMallName = (mall) =>
    mall.street || mall.mall_name || mall.city || "Mall";

  const getMallManager = (mallId) =>
    managers.find(
      (manager) => String(manager.mall_id ?? manager.mallId) === String(mallId),
    );

  const getMallStoreCount = (mallId) =>
    stores.filter(
      (store) => String(store.mall_id ?? store.mallId) === String(mallId),
    ).length;

  const getManagerName = (manager) => {
    if (!manager) return "—";

    const name = [manager.first_name, manager.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

    return name || "Mall Manager";
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (saving) return;

    const city = form.city.trim();
    const state = form.state.trim();
    const street = form.street.trim();

    if (!city || !state || !street) {
      setFormError("City, state, and street are required.");
      return;
    }

    const area = form.mall_area_sqft;
    const latitude = form.latitude;
    const longitude = form.longitude;

    if (area !== "" && (!Number.isFinite(Number(area)) || Number(area) < 0)) {
      setFormError("Enter a valid non-negative mall area.");
      return;
    }

    if (
      latitude !== "" &&
      (!Number.isFinite(Number(latitude)) ||
        Number(latitude) < -90 ||
        Number(latitude) > 90)
    ) {
      setFormError("Latitude must be between -90 and 90.");
      return;
    }

    if (
      longitude !== "" &&
      (!Number.isFinite(Number(longitude)) ||
        Number(longitude) < -180 ||
        Number(longitude) > 180)
    ) {
      setFormError("Longitude must be between -180 and 180.");
      return;
    }

    const mallData = {
      city,
      state,
      street,
      pincode: form.pincode.trim() || null,
      mall_area_sqft: area === "" ? null : Number(area),
      opening_date: form.opening_date || null,
      latitude: latitude === "" ? null : Number(latitude),
      longitude: longitude === "" ? null : Number(longitude),
      image_url: form.image_url.trim() || null,
      description: form.description.trim() || null,
    };

    setSaving(true);
    setFormError("");

    try {
      await apiCreateMall(mallData);

      setForm(EMPTY_MALL);
      setShowAdd(false);
      setRefresh((previous) => previous + 1);
    } catch (err) {
      setFormError(err.message || "Failed to create mall.");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (mall) => {
    setDeleteError("");
    setMallToDelete(mall);
  };

  const closeDeleteModal = () => {
    if (deletingMallId !== null) return;

    setMallToDelete(null);
    setDeleteError("");
  };

  const handleDeleteMall = async () => {
    if (!mallToDelete || deletingMallId !== null) return;

    const mall = mallToDelete;

    setDeletingMallId(mall.mall_id);
    setDeleteError("");

    try {
      await apiDeleteMall(mall.mall_id);

      setMalls((previous) =>
        previous.filter(
          (item) => String(item.mall_id) !== String(mall.mall_id),
        ),
      );

      setMallToDelete(null);
    } catch (err) {
      setDeleteError(err.message || `Failed to delete ${getMallName(mall)}.`);
    } finally {
      setDeletingMallId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading malls..." />;
  }

  if (loadError) {
    return <ErrorState message={loadError} />;
  }

  return (
    <div>
      <PageHeader
        title="Malls & Managers"
        subtitle="All malls and their assigned Mall Managers"
        action={
          <button
            type="button"
            onClick={() => {
              setFormError("");
              setShowAdd(true);
            }}
            className="btn-primary"
          >
            <Plus size={16} />
            Add Mall
          </button>
        }
      />

      {/* Malls and managers table */}
      <div className="card overflow-hidden">
        <DataTable
          columns={[
            {
              key: "mall",
              label: "Mall",
              render: (mall) => (
                <span className="font-medium text-slate-800">
                  {getMallName(mall)}
                </span>
              ),
            },
            {
              key: "location",
              label: "Location",
              render: (mall) => (
                <span className="text-slate-600">
                  {[mall.city, mall.state].filter(Boolean).join(", ")}
                </span>
              ),
            },
            {
              key: "manager",
              label: "Manager",
              render: (mall) => (
                <span className="font-medium text-slate-800">
                  {getManagerName(getMallManager(mall.mall_id))}
                </span>
              ),
            },
            {
              key: "manager_email",
              label: "Manager Email",
              render: (mall) => {
                const manager = getMallManager(mall.mall_id);

                return (
                  <span className="text-slate-600">
                    {manager?.email || "—"}
                  </span>
                );
              },
            },
            {
              key: "manager_phone",
              label: "Manager Phone",
              render: (mall) => {
                const manager = getMallManager(mall.mall_id);

                return (
                  <span className="text-slate-600">
                    {manager?.phone_number || manager?.phoneNumber || "—"}
                  </span>
                );
              },
            },
            {
              key: "stores",
              label: "Stores",
              render: (mall) => (
                <span className="text-slate-600">
                  {getMallStoreCount(mall.mall_id)}
                </span>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              render: (mall) => (
                <button
                  type="button"
                  onClick={() => openDeleteModal(mall)}
                  disabled={deletingMallId !== null}
                  title="Delete mall"
                  aria-label={`Delete ${getMallName(mall)}`}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-red-500 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                </button>
              ),
            },
          ]}
          rows={malls}
          emptyMessage="No malls found."
        />
      </div>

      <h3 className="font-semibold text-slate-900 mt-8 mb-3">All Malls</h3>

      {malls.length === 0 ? (
        <div className="card p-6 text-center text-slate-500 text-sm">
          No malls found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {malls.map((mall) => {
            const manager = getMallManager(mall.mall_id);
            const imageUrl = mall.imageUrl || mall.image_url;
            const pincode = mall.pincode || mall.postal_code;

            return (
              <div key={mall.mall_id} className="card overflow-hidden">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={getMallName(mall)}
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 bg-slate-100 flex items-center justify-center">
                    <Building2 size={32} className="text-slate-400" />
                  </div>
                )}

                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 mb-1 text-sm">
                    {getMallName(mall)}
                  </h3>

                  <p className="text-xs text-slate-400 mb-3">
                    {[mall.city, mall.state].filter(Boolean).join(", ")}
                    {pincode ? ` · ${pincode}` : ""}
                  </p>

                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Store size={13} />
                      Stores
                    </span>

                    <span className="font-medium text-slate-800">
                      {getMallStoreCount(mall.mall_id)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Manager</span>

                    <span className="font-medium text-slate-800 text-right">
                      {getManagerName(manager)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Delete Mall confirmation modal */}
      <Modal
        open={!!mallToDelete}
        onClose={closeDeleteModal}
        title="Remove Mall"
        size="md"
      >
        {mallToDelete && (
          <div className="space-y-5">
            <p className="text-sm text-slate-600">
              Remove{" "}
              <span className="font-semibold text-slate-900">
                {getMallName(mallToDelete)}
              </span>
              ?
            </p>

            {deleteError && (
              <p className="text-sm text-red-600" role="alert">
                {deleteError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deletingMallId !== null}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteMall}
                disabled={deletingMallId !== null}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingMallId !== null ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Mall modal */}
      <Modal
        open={showAdd}
        onClose={() => {
          if (!saving) {
            setShowAdd(false);
            setFormError("");
          }
        }}
        title="Add Mall"
        size="md"
      >
        <form className="space-y-4" onSubmit={handleCreate}>
          {formError && (
            <p className="text-sm text-red-600" role="alert">
              {formError}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">City</label>
              <input
                className="input"
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">State</label>
              <input
                className="input"
                value={form.state}
                onChange={(e) => updateField("state", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Street / Mall Name</label>
            <input
              className="input"
              value={form.street}
              onChange={(e) => updateField("street", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Pincode</label>
              <input
                className="input"
                value={form.pincode}
                onChange={(e) => updateField("pincode", e.target.value)}
              />
            </div>

            <div>
              <label className="label">Area (sqft)</label>
              <input
                type="number"
                min="0"
                step="any"
                className="input"
                value={form.mall_area_sqft}
                onChange={(e) => updateField("mall_area_sqft", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Opening Date</label>
            <input
              type="date"
              className="input"
              value={form.opening_date}
              onChange={(e) => updateField("opening_date", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Latitude</label>
              <input
                type="number"
                min="-90"
                max="90"
                step="any"
                className="input"
                value={form.latitude}
                onChange={(e) => updateField("latitude", e.target.value)}
              />
            </div>

            <div>
              <label className="label">Longitude</label>
              <input
                type="number"
                min="-180"
                max="180"
                step="any"
                className="input"
                value={form.longitude}
                onChange={(e) => updateField("longitude", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Image URL</label>
            <input
              type="url"
              className="input"
              value={form.image_url}
              onChange={(e) => updateField("image_url", e.target.value)}
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAdd(false);
                setFormError("");
              }}
              disabled={saving}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary disabled:opacity-50"
            >
              <Plus size={16} />
              {saving ? "Creating..." : "Create Mall"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
