import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../component/common/Navbar";
import { getUserRole } from "../hooks/useAuth";
import { getPlants } from "../data/plants";
import type { PlantItem } from "../data/plants";
import { getProducts } from "../data/product";
import type { ProductItem } from "../data/product";
import { getSuppliers } from "../data/suppliers";
import type { SupplierItem } from "../data/suppliers";
import {
  createStockPurchase,
  getStockPurchases,
  updatePlantStock,
} from "../data/stock";
import type {
  StockPurchaseItem,
  StockPurchasePayload,
} from "../data/stock";

const LOW_STOCK_LIMIT = 10;

type ItemTypeFilter = "All" | "Plant" | "Product";
type StockFilter = "All" | "In stock" | "Low stock" | "Out of stock";
type StockRecordBase = {
  id: string;
  itemId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  status: string;
};
type StockRecord =
  | (StockRecordBase & { type: "Plant"; item: PlantItem })
  | (StockRecordBase & { type: "Product"; item: ProductItem });

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-gray-50 focus:bg-white";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }
  return fallback;
};

const getStockStatus = (stock: number) => {
  if (stock === 0) return "Out of stock";
  if (stock <= LOW_STOCK_LIMIT) return "Low stock";
  return "In stock";
};

const getStatusClass = (status: string) => {
  if (status === "Out of stock") {
    return "bg-red-50 text-red-600 border-red-200";
  }
  if (status === "Low stock") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  return "bg-green-50 text-green-700 border-green-200";
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
            ? "Only administrators can manage stock."
            : "Log in with an administrator account to manage stock."}
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

const StockPage = () => {
  const role = getUserRole();
  const [plants, setPlants] = useState<PlantItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [purchases, setPurchases] = useState<StockPurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [purchaseError, setPurchaseError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ItemTypeFilter>("All");
  const [stockFilter, setStockFilter] = useState<StockFilter>("All");
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedItem, setSelectedItem] = useState<StockRecord | null>(null);
  const [editingPlant, setEditingPlant] = useState<StockRecord | null>(null);
  const [plantStock, setPlantStock] = useState("");
  const [savingPlant, setSavingPlant] = useState(false);
  const [plantFormError, setPlantFormError] = useState("");
  const [restockProduct, setRestockProduct] = useState<ProductItem | null>(null);
  const [purchaseSource, setPurchaseSource] =
    useState<StockPurchasePayload["purchaseSource"]>("Supplier");
  const [supplierId, setSupplierId] = useState("");
  const [shopName, setShopName] = useState("");
  const [purchaseQuantity, setPurchaseQuantity] = useState("");
  const [buyingPrice, setBuyingPrice] = useState("");
  const [savingPurchase, setSavingPurchase] = useState(false);
  const [purchaseFormError, setPurchaseFormError] = useState("");

  useEffect(() => {
    let active = true;

    const loadStockItems = async () => {
      try {
        setLoading(true);
        setListError("");
        const [firstPlantPage, productResult, supplierResult] =
          await Promise.all([
            getPlants({ page: 1, limit: 100 }),
            getProducts({}),
            getSuppliers({ status: "Active" }),
          ]);

        const allPlants = [...firstPlantPage.plants];
        for (let page = 2; page <= firstPlantPage.meta.totalPages; page += 1) {
          const nextPage = await getPlants({ page, limit: 100 });
          allPlants.push(...nextPage.plants);
        }

        if (active) {
          setPlants(allPlants);
          setProducts(productResult.products);
          setSuppliers(supplierResult.suppliers);
        }
      } catch (error) {
        console.error("Error in Loading Stock:", error);
        if (active) {
          setListError(getErrorMessage(error, "Could not load stock items."));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadStockItems();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    let active = true;
    const loadPurchases = async () => {
      try {
        setPurchaseError("");
        const result = await getStockPurchases("Selling");
        if (active) setPurchases(result);
      } catch (error) {
        console.error("Error in Loading Stock Purchase History:", error);
        if (active) {
          setPurchaseError(
            getErrorMessage(error, "Could not load product purchase history.")
          );
        }
      }
    };

    void loadPurchases();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const stockItems = useMemo<StockRecord[]>(
    () => [
      ...plants.map((plant) => ({
        id: plant._id,
        itemId: plant.plantId,
        name: plant.name,
        type: "Plant" as const,
        category: plant.category.join(", "),
        quantity: plant.stock,
        unit: "plants",
        status: getStockStatus(plant.stock),
        item: plant,
      })),
      ...products.map((product) => ({
        id: product._id,
        itemId: product.productId,
        name: product.productName,
        type: "Product" as const,
        category: product.category,
        quantity: product.stock,
        unit: product.unit,
        status: getStockStatus(product.stock),
        item: product,
      })),
    ],
    [plants, products]
  );

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return stockItems.filter((item) => {
      const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.itemId.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term);
      const matchesType = typeFilter === "All" || item.type === typeFilter;
      const matchesStatus =
        stockFilter === "All" || item.status === stockFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [search, stockFilter, stockItems, typeFilter]);

  const overview = useMemo(() => {
    const totalPlantStock = plants.reduce((total, plant) => total + plant.stock, 0);
    const totalProductStock = products.reduce(
      (total, product) => total + product.stock,
      0
    );
    return {
      totalPlantStock,
      totalProductStock,
      totalItems: plants.length + products.length,
      lowStockItems: stockItems.filter(
        (item) => item.quantity > 0 && item.quantity <= LOW_STOCK_LIMIT
      ).length,
      outOfStockItems: stockItems.filter((item) => item.quantity === 0).length,
    };
  }, [plants, products, stockItems]);

  const visiblePurchases = useMemo(() => {
    const productIds = new Set(products.map((product) => product.productId));
    return purchases.filter(
      (purchase) => purchase.productId && productIds.has(purchase.productId)
    );
  }, [products, purchases]);

  const openPlantStockEditor = (item: StockRecord) => {
    setEditingPlant(item);
    setPlantStock(String(item.quantity));
    setPlantFormError("");
  };

  const handlePlantStockUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingPlant || savingPlant) return;
    const parsedStock = Number(plantStock);
    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      setPlantFormError("Stock must be a whole number greater than or equal to zero.");
      return;
    }

    setSavingPlant(true);
    setPlantFormError("");
    setSuccess("");
    try {
      await updatePlantStock(editingPlant.itemId, parsedStock);
      setSuccess(`Stock for "${editingPlant.name}" was updated.`);
      setEditingPlant(null);
      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Error in Updating Plant Stock:", error);
      setPlantFormError(getErrorMessage(error, "Could not update plant stock."));
    } finally {
      setSavingPlant(false);
    }
  };

  const openRestockForm = (product: ProductItem) => {
    setRestockProduct(product);
    setPurchaseSource("Supplier");
    setSupplierId(suppliers[0]?.supplierId || "");
    setShopName("");
    setPurchaseQuantity("");
    setBuyingPrice(String(product.buyingPrice));
    setPurchaseFormError("");
  };

  const handleProductRestock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!restockProduct || savingPurchase) return;

    const quantity = Number(purchaseQuantity);
    const parsedBuyingPrice = Number(buyingPrice);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setPurchaseFormError("Quantity must be a positive whole number.");
      return;
    }
    if (!Number.isFinite(parsedBuyingPrice) || parsedBuyingPrice < 0) {
      setPurchaseFormError("Enter a valid buying price (0 or more).");
      return;
    }
    if (purchaseSource === "Supplier" && !supplierId) {
      setPurchaseFormError("Select an active supplier, or choose Shop as the source.");
      return;
    }
    if (purchaseSource === "Shop" && !shopName.trim()) {
      setPurchaseFormError("Shop name is required.");
      return;
    }

    const payload: StockPurchasePayload = {
      purchaseSource,
      stockPurpose: "Selling",
      productId: restockProduct.productId,
      quantity,
      buyingPrice: parsedBuyingPrice,
      ...(purchaseSource === "Supplier"
        ? { supplierId }
        : { sourceName: shopName.trim() }),
    };

    setSavingPurchase(true);
    setPurchaseFormError("");
    setSuccess("");
    try {
      await createStockPurchase(payload);
      setSuccess(
        `Added ${quantity} ${restockProduct.unit} to "${restockProduct.productName}" stock.`
      );
      setRestockProduct(null);
      setReloadKey((key) => key + 1);
    } catch (error) {
      console.error("Error in Restocking Product:", error);
      setPurchaseFormError(
        getErrorMessage(error, "Could not record the stock purchase.")
      );
    } finally {
      setSavingPurchase(false);
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
            Manage your <span className="text-green-700">stock</span>
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed mb-6 max-w-xl">
            Monitor quantities across plants and products using your existing
            inventory records.
          </p>
          <Link
            to="/admin"
            className="inline-block bg-white text-green-700 font-semibold text-sm px-5 py-2.5 rounded-full border border-green-100 shadow-sm hover:bg-green-50 transition"
          >
            ← Back to Admin
          </Link>
        </div>
      </section>

      <main className="py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-5">
              {success}
            </div>
          )}
          {listError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
              {listError}
              <button
                type="button"
                onClick={() => setReloadKey((key) => key + 1)}
                className="ml-3 font-semibold underline"
              >
                Try again
              </button>
            </div>
          )}

          <section aria-label="Stock overview" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
            {[
              { label: "Total Plant Stock", value: overview.totalPlantStock, icon: "🪴" },
              { label: "Total Product Stock", value: overview.totalProductStock, icon: "📦" },
              { label: "Total Stock Items", value: overview.totalItems, icon: "📋" },
              { label: "Low Stock Items", value: overview.lowStockItems, icon: "⚠️" },
              { label: "Out of Stock Items", value: overview.outOfStockItems, icon: "⛔" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl shadow-lg border border-green-100 p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <span className="text-xl">{stat.icon}</span>
                </div>
                <p className="mt-3 text-3xl font-bold text-gray-800">
                  {loading ? "—" : stat.value.toLocaleString()}
                </p>
              </div>
            ))}
          </section>

          <section className="bg-white rounded-2xl shadow-lg border border-green-100 p-5 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Stock Items</h2>
              <p className="text-gray-500 text-sm">
                Low stock means 10 or fewer units, matching the existing stock threshold.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <input
                type="search"
                aria-label="Search stock items"
                placeholder="Search by item, ID, or category..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={inputClass}
              />
              <select
                aria-label="Filter by item type"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as ItemTypeFilter)}
                className={inputClass}
              >
                <option value="All">All item types</option>
                <option value="Plant">Plants</option>
                <option value="Product">Products</option>
              </select>
              <select
                aria-label="Filter by stock status"
                value={stockFilter}
                onChange={(event) => setStockFilter(event.target.value as StockFilter)}
                className={inputClass}
              >
                <option value="All">All stock statuses</option>
                <option value="In stock">In stock</option>
                <option value="Low stock">Low stock</option>
                <option value="Out of stock">Out of stock</option>
              </select>
            </div>
            {loading ? (
              <div className="py-12 text-center text-gray-500" role="status">
                Loading stock items...
              </div>
            ) : listError ? (
              <div className="py-10 text-center text-gray-500">
                Stock items are unavailable until the load error is resolved.
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-5xl mb-3">🌱</div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {stockItems.length === 0
                    ? "No stock items yet"
                    : "No stock items match your filters"}
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  {stockItems.length === 0
                    ? "Add plants or products in their management pages."
                    : "Try changing the search or filters."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-green-100 text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-3 py-4 font-semibold">Item</th>
                      <th className="px-3 py-4 font-semibold">Type</th>
                      <th className="px-3 py-4 font-semibold">Category</th>
                      <th className="px-3 py-4 font-semibold">Current Stock</th>
                      <th className="px-3 py-4 font-semibold">Stock Status</th>
                      <th className="px-3 py-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-50">
                    {filteredItems.map((item) => (
                      <tr key={`${item.type}-${item.id}`} className="hover:bg-green-50/60 transition">
                        <td className="px-3 py-4">
                          <p className="font-semibold text-gray-800">{item.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{item.itemId}</p>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-600">{item.type}</td>
                        <td className="px-3 py-4 text-sm text-gray-600">{item.category}</td>
                        <td className="px-3 py-4 text-sm font-semibold text-gray-800">
                          {item.quantity.toLocaleString()} {item.unit}
                        </td>
                        <td className="px-3 py-4">
                          <span className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${getStatusClass(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedItem(item)}
                              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                            >
                              View
                            </button>
                            {item.type === "Plant" ? (
                              <button
                                type="button"
                                onClick={() => openPlantStockEditor(item)}
                                className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 transition"
                              >
                                Update Quantity
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={item.item.status !== "Active"}
                                onClick={() => openRestockForm(item.item as ProductItem)}
                                className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:opacity-50 transition"
                              >
                                Restock
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="mt-8 bg-white rounded-2xl shadow-lg border border-green-100 p-5 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                Product Stock Receipts
              </h2>
              <p className="text-gray-500 text-sm">
                Recorded product purchase entries, provided by the stock purchase API.
              </p>
            </div>
            {purchaseError ? (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {purchaseError}
              </div>
            ) : visiblePurchases.length === 0 ? (
              <p className="py-8 text-center text-gray-500">
                No product stock purchase records are available.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left">
                  <thead>
                    <tr className="border-b border-green-100 text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-3 py-4 font-semibold">Purchase ID</th>
                      <th className="px-3 py-4 font-semibold">Product</th>
                      <th className="px-3 py-4 font-semibold">Quantity Added</th>
                      <th className="px-3 py-4 font-semibold">Source</th>
                      <th className="px-3 py-4 font-semibold">Purchase Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-50">
                    {visiblePurchases.slice(0, 20).map((purchase) => (
                      <tr key={purchase._id} className="hover:bg-green-50/60 transition">
                        <td className="px-3 py-4 text-sm font-medium text-gray-800">
                          {purchase.purchaseId}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-700">
                          {purchase.itemName}
                        </td>
                        <td className="px-3 py-4 text-sm font-semibold text-gray-800">
                          +{purchase.quantity}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-600">
                          {purchase.sourceName}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-600">
                          {new Date(purchase.purchaseDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4 py-8"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedItem(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="stock-detail-title"
            className="w-full max-w-xl rounded-2xl border border-green-100 bg-white p-6 sm:p-8 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-sm font-medium text-green-700">
                  {selectedItem.type} stock details
                </p>
                <h2 id="stock-detail-title" className="mt-1 text-2xl font-bold text-gray-800">
                  {selectedItem.name}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close stock details"
                onClick={() => setSelectedItem(null)}
                className="rounded-lg px-3 py-1 text-2xl leading-none text-gray-500 hover:bg-gray-100 transition"
              >
                ×
              </button>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Item ID</dt>
                <dd className="mt-1 text-gray-800">{selectedItem.itemId}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Type</dt>
                <dd className="mt-1 text-gray-800">{selectedItem.type}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Category</dt>
                <dd className="mt-1 text-gray-800">{selectedItem.category}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Quantity</dt>
                <dd className="mt-1 text-gray-800">
                  {selectedItem.quantity} {selectedItem.unit}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Stock Status</dt>
                <dd className="mt-1 text-gray-800">{selectedItem.status}</dd>
              </div>
              {selectedItem.type === "Product" && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Product Status</dt>
                  <dd className="mt-1 text-gray-800">{selectedItem.item.status}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      )}

      {editingPlant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4 py-8">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="plant-stock-title"
            className="w-full max-w-lg rounded-2xl border border-green-100 bg-white p-6 sm:p-8 shadow-2xl"
          >
            <h2 id="plant-stock-title" className="text-2xl font-bold text-gray-800">
              Update Plant Quantity
            </h2>
            <p className="mt-1 mb-6 text-sm text-gray-500">
              {editingPlant.name} · current stock {editingPlant.quantity}
            </p>
            {plantFormError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
                {plantFormError}
              </div>
            )}
            <form className="space-y-5" onSubmit={handlePlantStockUpdate}>
              <div>
                <label htmlFor="plantStockQuantity" className={labelClass}>
                  New Stock Quantity
                </label>
                <input
                  id="plantStockQuantity"
                  type="number"
                  min="0"
                  step="1"
                  required
                  className={inputClass}
                  value={plantStock}
                  onChange={(event) => setPlantStock(event.target.value)}
                />
              </div>
              <p className="text-sm text-gray-500">
                This uses the existing plant stock update endpoint. The backend does
                not record an adjustment reason or plant stock history.
              </p>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={savingPlant}
                  className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl shadow-md transition"
                >
                  {savingPlant ? "Saving..." : "Update Stock"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPlant(null)}
                  className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4 py-8">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-restock-title"
            className="w-full max-w-lg max-h-full overflow-y-auto rounded-2xl border border-green-100 bg-white p-6 sm:p-8 shadow-2xl"
          >
            <h2 id="product-restock-title" className="text-2xl font-bold text-gray-800">
              Restock Product
            </h2>
            <p className="mt-1 mb-6 text-sm text-gray-500">
              {restockProduct.productName} · current stock {restockProduct.stock}{" "}
              {restockProduct.unit}
            </p>
            {purchaseFormError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
                {purchaseFormError}
              </div>
            )}
            <form className="space-y-5" onSubmit={handleProductRestock}>
              <div>
                <label htmlFor="purchaseSource" className={labelClass}>
                  Purchase Source
                </label>
                <select
                  id="purchaseSource"
                  value={purchaseSource}
                  onChange={(event) =>
                    setPurchaseSource(event.target.value as "Supplier" | "Shop")
                  }
                  className={inputClass}
                >
                  <option value="Supplier">Supplier</option>
                  <option value="Shop">Shop</option>
                </select>
              </div>
              {purchaseSource === "Supplier" ? (
                <div>
                  <label htmlFor="stockSupplier" className={labelClass}>
                    Active Supplier
                  </label>
                  <select
                    id="stockSupplier"
                    required
                    value={supplierId}
                    onChange={(event) => setSupplierId(event.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select a supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.supplierId} value={supplier.supplierId}>
                        {supplier.supplierName} ({supplier.supplierId})
                      </option>
                    ))}
                  </select>
                  {suppliers.length === 0 && (
                    <p className="mt-2 text-xs text-gray-500">
                      No active suppliers are available. Choose Shop to record another source.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label htmlFor="stockShopName" className={labelClass}>
                    Shop Name
                  </label>
                  <input
                    id="stockShopName"
                    required
                    maxLength={100}
                    className={inputClass}
                    value={shopName}
                    onChange={(event) => setShopName(event.target.value)}
                    placeholder="Enter shop name"
                  />
                </div>
              )}
              <div>
                <label htmlFor="purchaseQuantity" className={labelClass}>
                  Quantity to Add
                </label>
                <input
                  id="purchaseQuantity"
                  type="number"
                  min="1"
                  step="1"
                  required
                  className={inputClass}
                  value={purchaseQuantity}
                  onChange={(event) => setPurchaseQuantity(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="stockBuyingPrice" className={labelClass}>
                  Buying Price per Unit (Rs.)
                </label>
                <input
                  id="stockBuyingPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  className={inputClass}
                  value={buyingPrice}
                  onChange={(event) => setBuyingPrice(event.target.value)}
                />
                <p className="mt-2 text-xs text-gray-500">
                  The backend updates this product&apos;s buying price to the entered value.
                </p>
              </div>
              <p className="text-sm text-gray-500">
                Product stock can be increased through a recorded purchase. The
                existing backend does not support manual stock decrease or absolute
                quantity replacement here.
              </p>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={savingPurchase}
                  className="flex-1 bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl shadow-md transition"
                >
                  {savingPurchase ? "Saving..." : "Record Purchase"}
                </button>
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default StockPage;
