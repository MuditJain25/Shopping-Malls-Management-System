import { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle2, Pencil } from "lucide-react";

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
  apiCreateManager,
  apiDeleteManager,
  apiUpdateManager,
} from "@/lib/api.js";

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
  const [deletingManagerId, setDeletingManagerId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [managerToEdit, setManagerToEdit] = useState(null);
  const [managerToDelete, setManagerToDelete] = useState(null);

  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

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
            mall_id:
              previous.mall_id ||
              String(mallData[0].mall_id ?? mallData[0].mallId),
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
    if (!successMessage) return;

    const timeoutId = setTimeout(() => {
      setSuccessMessage("");
    }, 4000);

    return () => clearTimeout(timeoutId);
  }, [successMessage]);

  const getManagerId = (manager) => manager.manager_id ?? manager.managerId;

  const getManagerName = (manager) =>
    [manager.first_name, manager.last_name].filter(Boolean).join(" ") ||
    "Mall Manager";

  const getManagerMall = (manager) =>
    malls.find(
      (mall) =>
        String(mall.mall_id ?? mall.mallId) ===
        String(manager.mall_id ?? manager.mallId),
    );

  const getMallName = (mall) =>
    mall?.mall_name || mall?.street || mall?.city || "N/A";

  const openAddModal = () => {
    setManagerToEdit(null);
    setActionError(null);
    setSuccessMessage("");

    setForm({
      ...EMPTY_FORM,
      mall_id: malls.length ? String(malls[0].mall_id ?? malls[0].mallId) : "",
    });

    setShowForm(true);
  };

  const openEditModal = (manager) => {
    setManagerToEdit(manager);
    setActionError(null);
    setSuccessMessage("");

    setForm({
      first_name: manager.first_name || "",
      last_name: manager.last_name || "",
      email: manager.email || "",
      phone_number: manager.phone_number ?? manager.phoneNumber ?? "",
      mall_id: String(manager.mall_id ?? manager.mallId ?? ""),
    });

    setShowForm(true);
  };

  const closeFormModal = () => {
    if (saving) return;

    setShowForm(false);
    setManagerToEdit(null);
    setActionError(null);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (saving) return;

    const firstName = form.first_name.trim();
    const lastName = form.last_name.trim();
    const email = form.email.trim();

    if (!firstName || !lastName || !email || !form.mall_id) {
      setActionError("Please fill in all required fields.");
      return;
    }

    const managerData = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone_number: form.phone_number.trim(),
      mall_id: Number(form.mall_id),
    };

    setSaving(true);
    setActionError(null);
    setSuccessMessage("");

    try {
      if (managerToEdit) {
        const managerId = getManagerId(managerToEdit);
        const updatedManager = await apiUpdateManager(managerId, managerData);

        setManagers((previous) =>
          previous.map((manager) =>
            String(getManagerId(manager)) === String(managerId)
              ? {
                  ...manager,
                  ...managerData,
                  ...(updatedManager || {}),
                }
              : manager,
          ),
        );

        setSuccessMessage("Manager details updated successfully!");
      } else {
        const newManager = await apiCreateManager(managerData);

        if (newManager) {
          setManagers((previous) => [...previous, newManager]);
        }

        setSuccessMessage("Manager account created successfully!");
      }

      setForm({
        ...EMPTY_FORM,
        mall_id: malls.length
          ? String(malls[0].mall_id ?? malls[0].mallId)
          : "",
      });

      setShowForm(false);
      setManagerToEdit(null);
    } catch (err) {
      setActionError(
        err.message ||
          (managerToEdit
            ? "Failed to update manager."
            : "Failed to create manager account."),
      );
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (manager) => {
    setDeleteError(null);
    setManagerToDelete(manager);
  };

  const closeDeleteModal = () => {
    if (deletingManagerId !== null) return;

    setManagerToDelete(null);
    setDeleteError(null);
  };

  const handleDelete = async () => {
    if (!managerToDelete || deletingManagerId !== null) return;

    const managerId = getManagerId(managerToDelete);

    if (managerId == null) {
      setDeleteError("Manager ID is missing.");
      return;
    }

    setDeletingManagerId(managerId);
    setDeleteError(null);

    try {
      await apiDeleteManager(managerId);

      setManagers((previous) =>
        previous.filter(
          (manager) => String(getManagerId(manager)) !== String(managerId),
        ),
      );

      setManagerToDelete(null);
      setSuccessMessage("Manager removed successfully!");
    } catch (err) {
      setDeleteError(err.message || "Failed to remove manager.");
    } finally {
      setDeletingManagerId(null);
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
        title="Managers"
        subtitle="Manage all Mall Managers across malls"
        action={
          <button type="button" onClick={openAddModal} className="btn-primary">
            <Plus size={16} />
            Add Manager
          </button>
        }
      />

      {successMessage && (
        <div className="card p-3 mb-4 bg-green-50 border-green-200 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-green-600" />
          <span className="text-sm text-green-700">{successMessage}</span>
        </div>
      )}

      <div className="card overflow-hidden">
        <DataTable
          columns={[
            {
              key: "name",
              label: "Name",
              render: (manager) => (
                <span className="font-medium text-slate-800">
                  {getManagerName(manager)}
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
              render: (manager) => (
                <span className="text-slate-600">
                  {getManagerMall(manager)?.city || "N/A"}
                </span>
              ),
            },
            {
              key: "joined",
              label: "Joined",
              render: (manager) => (
                <span className="text-slate-500">
                  {manager.date_joined || manager.dateJoined || "N/A"}
                </span>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              render: (manager) => (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(manager)}
                    disabled={saving || deletingManagerId !== null}
                    title="Update manager"
                    aria-label={`Update ${getManagerName(manager)}`}
                    className="inline-flex items-center justify-center rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                  >
                    <Pencil size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => openDeleteModal(manager)}
                    disabled={saving || deletingManagerId !== null}
                    title="Remove manager"
                    aria-label={`Remove ${getManagerName(manager)}`}
                    className="inline-flex items-center justify-center rounded-lg p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ),
            },
          ]}
          rows={managers}
          emptyMessage="No managers found."
        />
      </div>

      <Modal
        open={showForm}
        onClose={closeFormModal}
        title={managerToEdit ? "Update Mall Manager" : "Add Mall Manager"}
        size="md"
      >
        <form onSubmit={handleSave}>
          <div className="space-y-4">
            {actionError && (
              <p className="text-sm text-red-600" role="alert">
                {actionError}
              </p>
            )}

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
                  <option
                    key={mall.mall_id ?? mall.mallId}
                    value={String(mall.mall_id ?? mall.mallId)}
                  >
                    {getMallName(mall)}
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
              {managerToEdit ? <Pencil size={16} /> : <Plus size={16} />}
              {saving
                ? managerToEdit
                  ? "Updating Manager..."
                  : "Creating Manager..."
                : managerToEdit
                  ? "Update Manager"
                  : "Create Manager Account"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!managerToDelete}
        onClose={closeDeleteModal}
        title="Remove Manager"
        size="md"
      >
        {managerToDelete && (
          <div className="space-y-5">
            <p className="text-sm text-slate-600">
              Remove{" "}
              <span className="font-semibold text-slate-900">
                {getManagerName(managerToDelete)}
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
                disabled={deletingManagerId !== null}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deletingManagerId !== null}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingManagerId !== null ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
