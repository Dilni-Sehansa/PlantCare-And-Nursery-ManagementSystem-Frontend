import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../component/common/Navbar";
import { getUserRole } from "../hooks/useAuth";
import {
  createSupplier,
  deleteSupplier,
  getSupplierById,
  getSuppliers,
  updateSupplier,
} from "../data/suppliers";
import type {
  SupplierItem,
  SupplierPayload,
  SupplierStatus,
} from "../data/suppliers";

const STATUSES: SupplierStatus[] = ["Active", "Inactive"];

const emptyForm: SupplierPayload = {
  supplierName: "",
  phone: "",
  email: "",
  address: "",
  status: "Active",
};

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-gray-50 focus:bg-white";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }
  return fallback;
};

const AccessDenied = ({ loggedIn }: { loggedIn: boolean }) => (
  <div className="min-h-screen bg-green-50">
    <Navbar />
    <div className="pt-32 px-6 flex justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-green-100 p-10 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {loggedIn ? "Admin access only" : "Please log in"}
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          {loggedIn
            ? "Only administrators can manage suppliers."
            : "Log in with an administrator account to manage suppliers."}
        </p>
        <Link
          to={loggedIn ? "/" : "/login"}
          className="inline-block bg-green-700 hover:bg-green-800 text-white font-semibold px-8 py-3 rounded-xl shadow-md transition"
        >
          {loggedIn ? "Back to Home" : "Go to Login"}
        </Link>
      </div>
    </div>
  </div>
);

const SupplierPage = () => {
  const role = getUserRole();
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [count, setCount] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SupplierStatus | "">("");
  const [reloadKey, setReloadKey] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState("");
  const [listSuccess, setListSuccess] = useState("");
  const [form, setForm] = useState<SupplierPayload>(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [togglingId, setTogglingId] = useState("");
  const [selectedSupplier, setSelectedSupplier] =
    useState<SupplierItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setLoadingList(true);
        setListError("");
        const result = await getSuppliers({
          search: search || undefined,
          status: statusFilter || undefined,
        });
        setSuppliers(result.suppliers);
        setCount(result.count);
      } catch (error) {
        console.error("Error in Loading Suppliers:", error);
        setListError(getErrorMessage(error, "Could not load suppliers."));
      } finally {
        setLoadingList(false);
      }
    };

    void loadSuppliers();
  }, [search, statusFilter, reloadKey]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
  };

  const startEdit = (supplier: SupplierItem) => {
    setFormError("");
    setFormSuccess("");
    setEditingId(supplier.supplierId);
    setForm({
      supplierName: supplier.supplierName,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      status: supplier.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    setFormError("");
    setFormSuccess("");
    const supplierName = form.supplierName.trim();
    const phone = form.phone.trim();
    const email = form.email.trim().toLowerCase();
    const address = form.address.trim();

    if (!supplierName) return setFormError("Supplier name is required.");
    if (!/^0[0-9]{9}$/.test(phone)) {
      return setFormError("Enter a valid 10-digit phone number starting with 0.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setFormError("Enter a valid email address.");
    }
    if (!address) return setFormError("Address is required.");

    const payload: SupplierPayload = {
      supplierName,
      phone,
      email,
      address,
      status: form.status,
    };

    try {
      setSaving(true);
      if (editingId) {
        await updateSupplier(editingId, payload);
        setFormSuccess(`"${supplierName}" was updated successfully.`);
      } else {
        await createSupplier(payload);
        setFormSuccess(`"${supplierName}" was added successfully.`);
      }
      resetForm();
      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Error in Saving Supplier:", error);
      setFormError(getErrorMessage(error, "Could not save supplier."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (supplier: SupplierItem) => {
    if (
      !window.confirm(
        `Delete "${supplier.supplierName}" (${supplier.supplierId})? This cannot be undone.`
      )
    ) {
      return;
    }

    setListError("");
    setListSuccess("");
    try {
      setDeletingId(supplier.supplierId);
      await deleteSupplier(supplier.supplierId);
      setListSuccess(`"${supplier.supplierName}" was deleted.`);
      if (editingId === supplier.supplierId) resetForm();
      if (selectedSupplier?.supplierId === supplier.supplierId) {
        setSelectedSupplier(null);
      }
      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Error in Deleting Supplier:", error);
      setListError(getErrorMessage(error, "Could not delete supplier."));
    } finally {
      setDeletingId("");
    }
  };

  const handleStatusChange = async (supplier: SupplierItem) => {
    if (togglingId) return;
    const status: SupplierStatus =
      supplier.status === "Active" ? "Inactive" : "Active";

    if (
      status === "Inactive" &&
      !window.confirm(`Deactivate "${supplier.supplierName}"?`)
    ) {
      return;
    }

    setListError("");
    setListSuccess("");
    try {
      setTogglingId(supplier.supplierId);
      await updateSupplier(supplier.supplierId, {
        supplierName: supplier.supplierName,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        status,
      });
      setListSuccess(
        `"${supplier.supplierName}" was ${status === "Active" ? "activated" : "deactivated"}.`
      );
      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Error in Changing Supplier Status:", error);
      setListError(getErrorMessage(error, "Could not change supplier status."));
    } finally {
      setTogglingId("");
    }
  };

  const handleView = async (supplier: SupplierItem) => {
    setSelectedSupplier(supplier);
    setDetailLoading(true);
    setDetailError("");
    try {
      setSelectedSupplier(await getSupplierById(supplier.supplierId));
    } catch (error) {
      console.error("Error in Loading Supplier Details:", error);
      setDetailError(getErrorMessage(error, "Could not load supplier details."));
    } finally {
      setDetailLoading(false);
    }
  };

  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return <AccessDenied loggedIn={role !== null} />;
  }

  return (
    <div className="min-h-screen bg-green-50">
      <Navbar />
      <section className="bg-[#e8f5e9] pt-28 pb-12 px-6 relative overflow-hidden">
        <div className="absolute -right-16 top-10 w-72 h-72 bg-green-100 rounded-full blur-3xl opacity-60"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/70 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full mb-5 shadow-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Admin · Nursery Management
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 leading-tight mb-4">
            Manage your <span className="text-green-700">suppliers</span>
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed mb-6 max-w-xl">
            Keep supplier contact details up to date and manage supplier status
            in one place.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/admin"
              className="bg-white text-green-700 font-semibold text-sm px-5 py-2.5 rounded-full border border-green-100 shadow-sm hover:bg-green-50 transition"
            >
              ← Back to Admin
            </Link>
            {!listError && (
              <span className="bg-white/70 text-green-700 text-sm font-medium px-4 py-2.5 rounded-full shadow-sm">
                {count} {count === 1 ? "supplier" : "suppliers"}
              </span>
            )}
          </div>
        </div>
      </section>

      <main className="py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 items-start">
          <div className="w-full lg:w-[380px] lg:shrink-0 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  {editingId ? "Edit Supplier" : "Add Supplier"}
                </h2>
                <p className="text-gray-500 text-sm">
                  {editingId ? `Updating ${editingId}` : "Register a nursery supplier"}
                </p>
              </div>
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-5">
                  {formSuccess}
                </div>
              )}
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="supplierName" className={labelClass}>
                    Supplier Name
                  </label>
                  <input
                    id="supplierName"
                    name="supplierName"
                    type="text"
                    autoComplete="organization"
                    maxLength={100}
                    required
                    className={inputClass}
                    placeholder="Enter supplier name"
                    value={form.supplierName}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="supplierPhone" className={labelClass}>
                    Phone Number
                  </label>
                  <input
                    id="supplierPhone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="numeric"
                    pattern="0[0-9]{9}"
                    maxLength={10}
                    required
                    className={inputClass}
                    placeholder="07XXXXXXXX"
                    value={form.phone}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Enter 10 digits, starting with 0.
                  </p>
                </div>
                <div>
                  <label htmlFor="supplierEmail" className={labelClass}>
                    Email Address
                  </label>
                  <input
                    id="supplierEmail"
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    required
                    className={inputClass}
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="supplierAddress" className={labelClass}>
                    Address
                  </label>
                  <textarea
                    id="supplierAddress"
                    name="address"
                    rows={3}
                    autoComplete="street-address"
                    maxLength={500}
                    required
                    className={inputClass}
                    placeholder="Enter supplier address"
                    value={form.address}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label htmlFor="supplierStatus" className={labelClass}>
                    Status
                  </label>
                  <select
                    id="supplierStatus"
                    name="status"
                    className={inputClass}
                    value={form.status}
                    onChange={handleChange}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl shadow-md transition hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Update Supplier"
                        : "Add Supplier"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setFormError("");
                        setFormSuccess("");
                      }}
                      className="px-5 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          <div className="w-full min-w-0 flex-1">
            <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  All Suppliers
                </h2>
                <p className="text-gray-500 text-sm">
                  Search by supplier ID, name, phone, or email, or filter by status.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <input
                  type="search"
                  aria-label="Search suppliers"
                  placeholder="Search suppliers..."
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  className={inputClass}
                />
                <select
                  aria-label="Filter by supplier status"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as SupplierStatus | "")
                  }
                  className={inputClass}
                >
                  <option value="">All statuses</option>
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              {listError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
                  {listError}
                </div>
              )}
              {listSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-5">
                  {listSuccess}
                </div>
              )}
              {loadingList ? (
                <div className="py-12 text-center text-gray-500" role="status">
                  Loading suppliers...
                </div>
              ) : listError && suppliers.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-gray-600 mb-4">Suppliers could not be loaded.</p>
                  <button
                    type="button"
                    onClick={() => setReloadKey((key) => key + 1)}
                    className="bg-green-700 hover:bg-green-800 text-white font-semibold px-5 py-2.5 rounded-xl transition"
                  >
                    Try Again
                  </button>
                </div>
              ) : suppliers.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="text-5xl mb-3">🌱</div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {search || statusFilter
                      ? "No suppliers match your filters"
                      : "No suppliers yet"}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {search || statusFilter
                      ? "Try changing your search or status filter."
                      : "Add your first supplier using the form."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left">
                    <thead>
                      <tr className="border-b border-green-100 text-xs uppercase tracking-wide text-gray-500">
                        <th className="px-3 py-4 font-semibold">Supplier</th>
                        <th className="px-3 py-4 font-semibold">Contact</th>
                        <th className="px-3 py-4 font-semibold">Address</th>
                        <th className="px-3 py-4 font-semibold">Status</th>
                        <th className="px-3 py-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-50">
                      {suppliers.map((supplier) => (
                        <tr key={supplier._id} className="hover:bg-green-50/60 transition">
                          <td className="px-3 py-4">
                            <p className="font-semibold text-gray-800">
                              {supplier.supplierName}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {supplier.supplierId}
                            </p>
                          </td>
                          <td className="px-3 py-4">
                            <a
                              className="block text-sm text-green-700 hover:underline"
                              href={`mailto:${supplier.email}`}
                            >
                              {supplier.email}
                            </a>
                            <a
                              className="block text-sm text-gray-600 mt-1 hover:text-green-700"
                              href={`tel:${supplier.phone}`}
                            >
                              {supplier.phone}
                            </a>
                          </td>
                          <td className="px-3 py-4 max-w-xs text-sm text-gray-600">
                            <span className="line-clamp-2">{supplier.address}</span>
                          </td>
                          <td className="px-3 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
                                supplier.status === "Active"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-red-50 text-red-600 border-red-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  supplier.status === "Active"
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                }`}
                              ></span>
                              {supplier.status}
                            </span>
                          </td>
                          <td className="px-3 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => void handleView(supplier)}
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => startEdit(supplier)}
                                className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 transition"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                disabled={togglingId === supplier.supplierId}
                                onClick={() => void handleStatusChange(supplier)}
                                className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-60 transition"
                              >
                                {togglingId === supplier.supplierId
                                  ? "Saving..."
                                  : supplier.status === "Active"
                                    ? "Deactivate"
                                    : "Activate"}
                              </button>
                              <button
                                type="button"
                                disabled={deletingId === supplier.supplierId}
                                onClick={() => void handleDelete(supplier)}
                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 transition"
                              >
                                {deletingId === supplier.supplierId
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {selectedSupplier && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4 py-8"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedSupplier(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="supplier-detail-title"
            className="w-full max-w-xl rounded-2xl border border-green-100 bg-white p-6 sm:p-8 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-sm font-medium text-green-700">Supplier details</p>
                <h2
                  id="supplier-detail-title"
                  className="mt-1 text-2xl font-bold text-gray-800"
                >
                  {selectedSupplier.supplierName}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close supplier details"
                onClick={() => setSelectedSupplier(null)}
                className="rounded-lg px-3 py-1 text-2xl leading-none text-gray-500 hover:bg-gray-100 transition"
              >
                ×
              </button>
            </div>
            {detailLoading ? (
              <p className="py-8 text-center text-gray-500" role="status">
                Loading supplier details...
              </p>
            ) : detailError ? (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {detailError}
              </div>
            ) : (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Supplier ID
                  </dt>
                  <dd className="mt-1 text-gray-800">{selectedSupplier.supplierId}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </dt>
                  <dd className="mt-1 text-gray-800">{selectedSupplier.status}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Phone
                  </dt>
                  <dd className="mt-1 text-gray-800">{selectedSupplier.phone}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Email
                  </dt>
                  <dd className="mt-1 break-words text-gray-800">
                    {selectedSupplier.email}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Address
                  </dt>
                  <dd className="mt-1 text-gray-800">{selectedSupplier.address}</dd>
                </div>
              </dl>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default SupplierPage;
