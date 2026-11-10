import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../component/common/Navbar";
import { getUserRole } from "../hooks/useAuth";
import {
  getProducts,
  createProduct,
  updateProduct,
  activateProduct,
  deactivateProduct,
} from "../data/product";
import type {
  ProductItem,
  ProductCategory,
  ProductStatus,
  ProductPayload,
} from "../data/product";

const CATEGORIES: ProductCategory[] = [
  "Fertilizer",
  "Pesticide",
  "Medicine",
  "Seeds",
  "Other",
];
const STATUSES: ProductStatus[] = ["Active", "Inactive"];
const COMMON_UNITS = ["kg", "g", "L", "ml", "pcs", "pack", "bag", "bottle"];
const LOW_STOCK_LIMIT = 10;

const CATEGORY_ICON: Record<ProductCategory, string> = {
  Fertilizer: "🌾",
  Pesticide: "🐛",
  Medicine: "💊",
  Seeds: "🌰",
  Other: "📦",
};

const emptyForm = {
  productName: "",
  category: "" as ProductCategory | "",
  description: "",
  unit: "",
  buyingPrice: "",
  sellingPrice: "",
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

const isValidPrice = (value: string) =>
  value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) >= 0;

const formatPrice = (value: number) => `Rs. ${Number(value).toLocaleString()}`;

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
            ? "Only administrators can manage products."
            : "Log in with an administrator account to manage products."}
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

const ProductManager = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [count, setCount] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "">("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "">("");
  const [reloadKey, setReloadKey] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState("");
  const [listSuccess, setListSuccess] = useState("");
  const [togglingId, setTogglingId] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [editingStock, setEditingStock] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoadingList(true);
        setListError("");

        const result = await getProducts({
          search: search || undefined,
          category: categoryFilter || undefined,
          status: statusFilter || undefined,
        });

        setProducts(result.products);
        setCount(result.count);
      } catch (error) {
        console.error("Error in Loading Products:", error);
        setListError(getErrorMessage(error, "Could not load products."));
      } finally {
        setLoadingList(false);
      }
    };

    loadProducts();
  }, [search, categoryFilter, statusFilter, reloadKey]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
    setEditingStock(null);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("");
  };

  const hasFilters = searchInput || categoryFilter || statusFilter;

  const startEdit = (product: ProductItem) => {
    setFormError("");
    setFormSuccess("");
    setEditingId(product.productId);
    setEditingStock(product.stock);
    setForm({
      productName: product.productName,
      category: product.category,
      description: product.description,
      unit: product.unit,
      buyingPrice: String(product.buyingPrice),
      sellingPrice: String(product.sellingPrice),
    });

    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;

    setFormError("");
    setFormSuccess("");

    if (!form.productName.trim()) {
      return setFormError("Product name is required.");
    }
    if (!form.category) {
      return setFormError("Please select a category.");
    }
    if (!form.description.trim()) {
      return setFormError("Description is required.");
    }
    if (!form.unit.trim()) {
      return setFormError("Unit is required (e.g. kg, L, pcs).");
    }
    if (!isValidPrice(form.buyingPrice)) {
      return setFormError("Enter a valid buying price (0 or more).");
    }
    if (!isValidPrice(form.sellingPrice)) {
      return setFormError("Enter a valid selling price (0 or more).");
    }

    const payload: ProductPayload = {
      productName: form.productName.trim(),
      category: form.category,
      description: form.description.trim(),
      unit: form.unit.trim(),
      buyingPrice: Number(form.buyingPrice),
      sellingPrice: Number(form.sellingPrice),
    };

    try {
      setSaving(true);

      if (editingId) {
        await updateProduct(editingId, payload);
        setFormSuccess(`"${payload.productName}" was updated successfully.`);
      } else {
        await createProduct(payload);
        setFormSuccess(`"${payload.productName}" was added successfully.`);
        clearFilters();
      }

      resetForm();
      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Error in Saving Product:", error);
      setFormError(getErrorMessage(error, "Could not save product."));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (product: ProductItem) => {
    if (togglingId) return;

    const deactivating = product.status === "Active";

    if (
      deactivating &&
      !window.confirm(
        `Deactivate "${product.productName}"? Customers will no longer see it.`
      )
    ) {
      return;
    }

    setListError("");
    setListSuccess("");

    try {
      setTogglingId(product.productId);

      if (deactivating) {
        await deactivateProduct(product.productId);
        setListSuccess(`"${product.productName}" was deactivated.`);
      } else {
        await activateProduct(product.productId);
        setListSuccess(`"${product.productName}" was activated.`);
      }

      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Error in Changing Product Status:", error);
      setListError(getErrorMessage(error, "Could not change product status."));
    } finally {
      setTogglingId("");
    }
  };

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
            Manage your
            <br />
            <span className="text-green-700">products</span>
          </h1>

          <p className="text-gray-600 text-lg leading-relaxed mb-6 max-w-xl">
            Register fertilizers, seeds and other nursery products, update
            their prices and control which ones customers can see.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/plants"
              className="bg-white text-green-700 font-semibold text-sm px-5 py-2.5 rounded-full border border-green-100 shadow-sm hover:bg-green-50 transition"
            >
              ← Back to Plants
            </Link>

            {!listError && (
              <span className="bg-white/70 text-green-700 text-sm font-medium px-4 py-2.5 rounded-full shadow-sm">
                {count} {count === 1 ? "product" : "products"}
              </span>
            )}
          </div>
        </div>
      </section>

      <main className="py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 items-start">
          <div
            ref={formRef}
            className="w-full lg:w-[380px] lg:shrink-0 lg:sticky lg:top-24 scroll-mt-24"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  {editingId ? "Edit Product" : "Add Product"}
                </h2>
                <p className="text-gray-500 text-sm">
                  {editingId
                    ? `Updating ${editingId}`
                    : "Register a new product in your catalog"}
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
                  <label htmlFor="productName" className={labelClass}>
                    Product Name
                  </label>
                  <input
                    id="productName"
                    name="productName"
                    type="text"
                    placeholder="Enter product name"
                    className={inputClass}
                    value={form.productName}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="category" className={labelClass}>
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    className={inputClass}
                    value={form.category}
                    onChange={handleChange}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="description" className={labelClass}>
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    placeholder="What is this product used for?"
                    className={inputClass}
                    value={form.description}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="unit" className={labelClass}>
                    Unit
                  </label>
                  <input
                    id="unit"
                    name="unit"
                    type="text"
                    list="unit-options"
                    placeholder="e.g. kg, L, pcs"
                    className={inputClass}
                    value={form.unit}
                    onChange={handleChange}
                  />
                  <datalist id="unit-options">
                    {COMMON_UNITS.map((unit) => (
                      <option key={unit} value={unit} />
                    ))}
                  </datalist>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="buyingPrice" className={labelClass}>
                      Buying Price (Rs.)
                    </label>
                    <input
                      id="buyingPrice"
                      name="buyingPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className={inputClass}
                      value={form.buyingPrice}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="sellingPrice" className={labelClass}>
                      Selling Price (Rs.)
                    </label>
                    <input
                      id="sellingPrice"
                      name="sellingPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className={inputClass}
                      value={form.sellingPrice}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-gray-600">
                  {editingId ? (
                    <>
                      <span className="font-semibold text-gray-800">
                        Current stock: {editingStock}
                      </span>
                      <br />
                      Stock cannot be edited here. Add stock through Stock
                      Purchase.
                    </>
                  ) : (
                    <>
                      New products start with <b>0 stock</b>. Add stock later
                      through Stock Purchase.
                    </>
                  )}
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
                      ? "Update Product"
                      : "Add Product"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setFormError("");
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
                  All Products
                </h2>
                <p className="text-gray-500 text-sm">
                  Search by name or product ID, or filter by category and status
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
                <input
                  type="text"
                  placeholder="Search products..."
                  className={`${inputClass} sm:col-span-2 xl:col-span-1`}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />

                <select
                  className={inputClass}
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(e.target.value as ProductCategory | "")
                  }
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <select
                  className={inputClass}
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as ProductStatus | "")
                  }
                >
                  <option value="">All Statuses</option>
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasFilters}
                  className="px-5 py-3 rounded-xl border border-green-200 text-green-700 font-semibold hover:bg-green-50 disabled:opacity-40 transition"
                >
                  Clear Filters
                </button>
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
                <div className="flex flex-col items-center py-16 text-gray-500 text-sm">
                  <span className="w-8 h-8 border-4 border-green-100 border-t-green-600 rounded-full animate-spin mb-3"></span>
                  Loading products...
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3">📦</div>
                  <p className="text-gray-500 text-sm">
                    {hasFilters
                      ? "No products match your filters."
                      : "No products yet. Add one using the form."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  {products.map((product) => {
                    const inactive = product.status === "Inactive";

                    return (
                      <div
                        key={product._id}
                        className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg transition p-5 flex flex-col ${
                          inactive
                            ? "border-gray-200 bg-gray-50"
                            : "border-green-100 hover:border-green-300"
                        }`}
                      >

                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className={`w-11 h-11 shrink-0 rounded-full border flex items-center justify-center text-xl ${
                              inactive
                                ? "bg-gray-100 border-gray-200 grayscale"
                                : "bg-green-50 border-green-100"
                            }`}
                          >
                            {CATEGORY_ICON[product.category]}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3
                              className={`font-bold text-lg leading-snug ${
                                inactive ? "text-gray-500" : "text-gray-800"
                              }`}
                            >
                              {product.productName}
                            </h3>
                            <p className="text-xs text-gray-400">
                              {product.productId}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full border ${
                              inactive
                                ? "bg-gray-100 text-gray-500 border-gray-200"
                                : "bg-green-50 text-green-700 border-green-200"
                            }`}
                          >
                            {product.status}
                          </span>
                        </div>

                        <span className="self-start bg-white text-green-700 text-xs font-medium px-3 py-1 rounded-full border border-green-200 mb-3">
                          {product.category}
                        </span>

                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-4">
                          {product.description}
                        </p>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                            <p className="text-xs text-gray-500">Unit</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {product.unit}
                            </p>
                          </div>

                          <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                            <p className="text-xs text-gray-500">Stock</p>
                            <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                              {product.stock} {product.unit}
                              {product.stock === 0 ? (
                                <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full">
                                  Out
                                </span>
                              ) : product.stock <= LOW_STOCK_LIMIT ? (
                                <span className="text-[10px] bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">
                                  Low
                                </span>
                              ) : null}
                            </p>
                          </div>

                          <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                            <p className="text-xs text-gray-500">
                              Buying Price
                            </p>
                            <p className="text-sm font-semibold text-gray-800">
                              {formatPrice(product.buyingPrice)}
                            </p>
                          </div>

                          <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                            <p className="text-xs text-gray-500">
                              Selling Price
                            </p>
                            <p className="text-sm font-bold text-green-700">
                              {formatPrice(product.sellingPrice)}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-auto">
                          <button
                            type="button"
                            onClick={() => startEdit(product)}
                            className="flex-1 border border-green-200 text-green-700 hover:bg-green-50 font-semibold text-sm py-2.5 rounded-xl transition"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(product)}
                            disabled={togglingId === product.productId}
                            className={`flex-1 disabled:opacity-60 font-semibold text-sm py-2.5 rounded-xl border transition ${
                              inactive
                                ? "border-green-700 bg-green-700 text-white hover:bg-green-800"
                                : "border-red-200 text-red-600 hover:bg-red-50"
                            }`}
                          >
                            {togglingId === product.productId
                              ? "Please wait..."
                              : inactive
                              ? "Activate"
                              : "Deactivate"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const Products = () => {
  const role = getUserRole();

  if (role !== "ADMIN") {
    return <AccessDenied loggedIn={role !== null} />;
  }

  return <ProductManager />;
};

export default Products;