import { useState, useEffect } from "react";
import { Building2, Pencil } from "lucide-react";
import { PageHeader } from "@/components/ui/index.jsx";
import Modal from "@/components/ui/Modal";
import { apiGetMallById, apiUpdateStore } from "@/lib/api";

export default function StoresView({ stores, role, onStoreUpdated }) {
  const isShopManager = role === "shop_manager";

  const [malls, setMalls] = useState({});
  const [editingStore, setEditingStore] = useState(null);
  const [editForm, setEditForm] = useState({
    store_name: "",
    shop_number: "",
    floor: "",
    area_sqft: "",
    status: "",
    listing_media: "",
  });
  const [savingStore, setSavingStore] = useState(false);
  const [editError, setEditError] = useState("");
  const [displayStores, setDisplayStores] = useState(stores);

  useEffect(() => {
    setDisplayStores(stores);
  }, [stores]);

  const handleOpenEdit = (store) => {
    const listingMedia = Array.isArray(store.listing_media)
      ? (store.listing_media[0] ?? "")
      : (store.listing_media ?? "");

    setEditingStore(store);
    setEditForm({
      store_name: store.store_name ?? "",
      shop_number: store.shop_number ?? "",
      floor: store.floor ?? "",
      area_sqft: store.area_sqft ?? "",
      status: store.status ?? "",
      listing_media: listingMedia,
    });
    setEditError("");
  };

  const handleSaveStore = async () => {
    if (!editingStore) return;

    const storeName = editForm.store_name.trim();
    const floorValue = editForm.floor;
    const areaValue = editForm.area_sqft;

    if (!storeName) {
      setEditError("Store name is required.");
      return;
    }

    if (floorValue === "" || !Number.isInteger(Number(floorValue))) {
      setEditError("Enter a valid floor number.");
      return;
    }

    if (
      areaValue === "" ||
      !Number.isFinite(Number(areaValue)) ||
      Number(areaValue) < 0
    ) {
      setEditError("Enter a valid non-negative area.");
      return;
    }

    const updatedStoreData = {
      store_name: storeName,
      mall_id: editingStore.mall_id,
      shop_number: editForm.shop_number.trim() || null,
      floor: Number(floorValue),
      area_sqft: Number(areaValue),
      status: editForm.status.trim() || null,
      listing_media: editForm.listing_media.trim() || null,
    };

    setSavingStore(true);
    setEditError("");

    try {
      const savedStore = await apiUpdateStore(
        editingStore.store_id,
        updatedStoreData,
      );

      const updatedStore = {
        ...editingStore,
        ...updatedStoreData,
        ...(savedStore ?? {}),
      };

      setDisplayStores((currentStores) =>
        currentStores.map((store) =>
          String(store.store_id) === String(updatedStore.store_id)
            ? { ...store, ...updatedStore }
            : store,
        ),
      );

      onStoreUpdated(updatedStore);

      setEditingStore(null);
      setEditError("");
    } catch (error) {
      setEditError(error.message || "Failed to update the store.");
    } finally {
      setSavingStore(false);
    }
  };

  useEffect(() => {
    if (stores.length === 0) return;

    let cancelled = false;

    const mallIds = [
      ...new Set(
        stores.map((store) => store.mall_id).filter((id) => id != null),
      ),
    ];

    Promise.all(
      mallIds.map(async (mallId) => {
        const mall = await apiGetMallById(mallId);
        return [String(mallId), mall];
      }),
    )
      .then((entries) => {
        if (!cancelled) {
          setMalls(Object.fromEntries(entries));
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to load store mall details:", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [stores]);

  return (
    <div>
      <PageHeader title="My Stores" subtitle="All stores you operate" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayStores.map((store) => {
          const mall = malls[String(store.mall_id)];

          return (
            <div key={store.store_id} className="card overflow-hidden">
              <img
                src={store.listing_media}
                alt={store.store_name}
                className="w-full h-32 object-cover"
              />

              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h3 className="font-semibold text-slate-900 text-sm">
                    {store.store_name}
                  </h3>

                  {!isShopManager && (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(store)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                  <Building2 size={12} /> {mall?.city}, {mall?.state} · Shop{" "}
                  {store.shop_number}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2.5 rounded-lg bg-slate-50">
                    <p className="text-slate-400 text-xs">Floor</p>
                    <p className="font-medium text-slate-800 text-sm">
                      Floor {store.floor}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50">
                    <p className="text-slate-400 text-xs">Area</p>
                    <p className="font-medium text-slate-800 text-sm">
                      {store.area_sqft} sqft
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={!!editingStore}
        onClose={() => {
          if (!savingStore) {
            setEditingStore(null);
            setEditError("");
          }
        }}
        title="Edit Store"
        size="md"
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            handleSaveStore();
          }}
        >
          <div>
            <label className="label">Store Name</label>
            <input
              className="input"
              value={editForm.store_name}
              onChange={(e) =>
                setEditForm({ ...editForm, store_name: e.target.value })
              }
              placeholder="Enter store name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Shop Number</label>
              <input
                className="input"
                value={editForm.shop_number}
                onChange={(e) =>
                  setEditForm({ ...editForm, shop_number: e.target.value })
                }
                placeholder="e.g. A-12"
              />
            </div>

            <div>
              <label className="label">Floor</label>
              <input
                type="number"
                step="1"
                className="input"
                value={editForm.floor}
                onChange={(e) =>
                  setEditForm({ ...editForm, floor: e.target.value })
                }
                placeholder="Floor number"
              />
            </div>
          </div>

          <div>
            <label className="label">Area (sqft)</label>
            <input
              type="number"
              min="0"
              step="any"
              className="input"
              value={editForm.area_sqft}
              onChange={(e) =>
                setEditForm({ ...editForm, area_sqft: e.target.value })
              }
              placeholder="Enter area"
            />
          </div>

          <div>
            <label className="label">Status</label>
            <input
              className="input"
              value={editForm.status}
              onChange={(e) =>
                setEditForm({ ...editForm, status: e.target.value })
              }
              placeholder="Current store status"
            />
          </div>

          <div>
            <label className="label">Listing Image URL</label>
            <input
              className="input"
              value={editForm.listing_media}
              onChange={(e) =>
                setEditForm({ ...editForm, listing_media: e.target.value })
              }
              placeholder="Enter image URL"
            />
          </div>

          {editError && (
            <p className="text-sm text-red-600" role="alert">
              {editError}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              disabled={savingStore}
              onClick={() => {
                setEditingStore(null);
                setEditError("");
              }}
              className="btn-secondary flex-1 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={savingStore}
              className="btn-primary flex-1 disabled:opacity-60"
            >
              {savingStore ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
