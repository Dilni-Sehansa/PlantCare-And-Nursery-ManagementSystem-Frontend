import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { getInternalStockItems } from "../../data/internalStock";
import type { InternalStockItem } from "../../data/internalStock";
import { getProducts } from "../../data/product";
import type { ProductItem } from "../../data/product";
import { getSuppliers } from "../../data/suppliers";
import type { SupplierItem } from "../../data/suppliers";
import {
  createStockPurchase,
  getStockPurchaseById,
  getStockPurchases,
} from "../../data/stockPurchase";
import type {
  StockPurchaseItem,
  StockPurchasePayload,
  StockPurchasePurpose,
  StockPurchaseSource,
} from "../../data/stockPurchase";
import {
  Alert,
  Dialog,
  ErrorMessage,
  inputClass,
  labelClass,
  SectionCard,
} from "./common";

const initialDate = () => new Date().toISOString().slice(0, 10);

const StockPurchase = () => {
  const [purchases, setPurchases] = useState<StockPurchaseItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [internalItems, setInternalItems] = useState<InternalStockItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [purpose, setPurpose] = useState<StockPurchasePurpose>("Selling");
  const [source, setSource] = useState<StockPurchaseSource>("Supplier");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [newInternalItem, setNewInternalItem] = useState(false);
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [shopName, setShopName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [buyingPrice, setBuyingPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(initialDate);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<StockPurchaseSource | "">("");
  const [purposeFilter, setPurposeFilter] = useState<StockPurchasePurpose | "">("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedPurchase, setSelectedPurchase] =
    useState<StockPurchaseItem | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const [purchaseRows, productRows, internalRows, supplierRows] =
          await Promise.all([
            getStockPurchases({
              search: search || undefined,
              purchaseSource: sourceFilter || undefined,
              stockPurpose: purposeFilter || undefined,
            }),
            getProducts({}),
            getInternalStockItems(),
            getSuppliers({ status: "Active" }),
          ]);
        if (active) {
          setPurchases(purchaseRows);
          setProducts(productRows.products);
          setInternalItems(internalRows);
          setSuppliers(supplierRows.suppliers);
        }
      } catch (loadError) {
        console.error("Error loading stock purchases:", loadError);
        if (active) setError(ErrorMessage(loadError, "Could not load stock purchases."));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [purposeFilter, reloadKey, search, sourceFilter]);

  const selectedProduct = products.find((item) => item.productId === selectedItemId);
  const selectedInternal = internalItems.find(
    (item) => item.internalItemId === selectedItemId
  );
  const total = useMemo(
    () => (Number(quantity) || 0) * (Number(buyingPrice) || 0),
    [buyingPrice, quantity]
  );

  const reset = () => {
    setSelectedItemId("");
    setNewInternalItem(false);
    setItemName("");
    setCategory("");
    setDescription("");
    setUnit("");
    setQuantity("");
    setBuyingPrice("");
    setPurchaseDate(initialDate());
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const parsedQuantity = Number(quantity);
    const parsedBuyingPrice = Number(buyingPrice);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setFormError("Quantity must be a positive whole number.");
      return;
    }
    if (!Number.isFinite(parsedBuyingPrice) || parsedBuyingPrice < 0) {
      setFormError("Enter a valid buying price.");
      return;
    }
    if (source === "Supplier" && !supplierId) {
      setFormError("Select an active supplier or choose Shop as the source.");
      return;
    }
    if (source === "Shop" && !shopName.trim()) {
      setFormError("Shop name is required.");
      return;
    }
    if (purpose === "Selling" && !selectedProduct) {
      setFormError("Select an existing product.");
      return;
    }
    if (purpose === "Internal" && newInternalItem) {
      if (!itemName.trim() || !category.trim() || !description.trim() || !unit.trim()) {
        setFormError("Complete all required fields for the new internal stock item.");
        return;
      }
    } else if (purpose === "Internal" && !selectedInternal) {
      setFormError("Select an existing internal stock item or create a new one.");
      return;
    }

    const payload: StockPurchasePayload = {
      purchaseSource: source,
      stockPurpose: purpose,
      quantity: parsedQuantity,
      buyingPrice: parsedBuyingPrice,
      purchaseDate,
      ...(source === "Supplier"
        ? { supplierId }
        : { sourceName: shopName.trim() }),
      ...(purpose === "Selling" && selectedProduct
        ? { productId: selectedProduct.productId }
        : {}),
      ...(purpose === "Internal" && newInternalItem
        ? {
            itemName: itemName.trim(),
            category: category.trim(),
            description: description.trim(),
            unit: unit.trim(),
          }
        : {}),
      ...(purpose === "Internal" && !newInternalItem && selectedInternal
        ? { internalItemId: selectedInternal.internalItemId }
        : {}),
    };
    setSaving(true);
    setFormError("");
    setError("");
    setSuccess("");
    try {
      await createStockPurchase(payload);
      setSuccess("Stock purchase recorded and item stock updated.");
      reset();
      setReloadKey((key) => key + 1);
    } catch (submitError) {
      console.error("Error creating stock purchase:", submitError);
      setFormError(ErrorMessage(submitError, "Could not record stock purchase."));
    } finally {
      setSaving(false);
    }
  };

  const viewPurchase = async (purchase: StockPurchaseItem) => {
    try {
      const details = await getStockPurchaseById(purchase.purchaseId);
      setSelectedPurchase(details);
    } catch (detailsError) {
      console.error("Error loading stock purchase details:", detailsError);
      setError(ErrorMessage(detailsError, "Could not load purchase details."));
    }
  };

  return (
    <div className="space-y-6">
      {success && <Alert type="success">{success}</Alert>}
      {error && <Alert type="error">{error}</Alert>}

      <SectionCard
        title="Record Stock Purchase"
        description="A successful purchase updates the selected Product or Internal Stock record automatically."
      >
        {formError && <Alert type="error">{formError}</Alert>}
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={submit}>
          <div>
            <label htmlFor="purchasePurpose" className={labelClass}>Stock Purpose</label>
            <select
              id="purchasePurpose"
              className={inputClass}
              value={purpose}
              onChange={(event) => {
                setPurpose(event.target.value as StockPurchasePurpose);
                setSelectedItemId("");
              }}
            >
              <option value="Selling">Product (for selling)</option>
              <option value="Internal">Internal nursery stock</option>
            </select>
          </div>
          <div>
            <label htmlFor="purchaseSource" className={labelClass}>Purchase Source</label>
            <select
              id="purchaseSource"
              className={inputClass}
              value={source}
              onChange={(event) => setSource(event.target.value as StockPurchaseSource)}
            >
              <option value="Supplier">Supplier</option>
              <option value="Shop">Shop</option>
            </select>
          </div>
          {source === "Supplier" ? (
            <div>
              <label htmlFor="purchaseSupplier" className={labelClass}>Active Supplier</label>
              <select
                id="purchaseSupplier"
                required
                className={inputClass}
                value={supplierId}
                onChange={(event) => setSupplierId(event.target.value)}
              >
                <option value="">Select supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.supplierId} value={supplier.supplierId}>
                    {supplier.supplierName} ({supplier.supplierId})
                  </option>
                ))}
              </select>
              {suppliers.length === 0 && (
                <p className="mt-1 text-xs text-gray-500">No active suppliers found.</p>
              )}
            </div>
          ) : (
            <div>
              <label htmlFor="purchaseShop" className={labelClass}>Shop Name</label>
              <input
                id="purchaseShop"
                required
                className={inputClass}
                value={shopName}
                onChange={(event) => setShopName(event.target.value)}
              />
            </div>
          )}
          {purpose === "Selling" ? (
            <>
              <div>
                <label htmlFor="purchaseProduct" className={labelClass}>Existing Product</label>
                <select
                  id="purchaseProduct"
                  required
                  className={inputClass}
                  value={selectedItemId}
                  onChange={(event) => {
                    setSelectedItemId(event.target.value);
                    const product = products.find(
                      (row) => row.productId === event.target.value
                    );
                    if (product) setBuyingPrice(String(product.buyingPrice));
                  }}
                >
                  <option value="">Select product</option>
                  {products.filter((product) => product.status === "Active").map((product) => (
                    <option key={product.productId} value={product.productId}>
                      {product.productName} ({product.productId})
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="md:col-span-2 flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="internalPurchaseItem"
                    checked={!newInternalItem}
                    onChange={() => setNewInternalItem(false)}
                  />
                  Restock existing item
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="internalPurchaseItem"
                    checked={newInternalItem}
                    onChange={() => setNewInternalItem(true)}
                  />
                  Add new item through purchase
                </label>
              </div>
              {newInternalItem ? (
                <>
                  <div>
                    <label htmlFor="newInternalName" className={labelClass}>Item Name</label>
                    <input id="newInternalName" className={inputClass} value={itemName} onChange={(event) => setItemName(event.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="newInternalCategory" className={labelClass}>Category</label>
                    <input id="newInternalCategory" className={inputClass} value={category} onChange={(event) => setCategory(event.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="newInternalDescription" className={labelClass}>Description</label>
                    <input id="newInternalDescription" className={inputClass} value={description} onChange={(event) => setDescription(event.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="newInternalUnit" className={labelClass}>Unit</label>
                    <input id="newInternalUnit" className={inputClass} value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="e.g. kg, bag, L" />
                  </div>
                </>
              ) : (
                <div className="md:col-span-2">
                  <label htmlFor="purchaseInternalItem" className={labelClass}>Existing Internal Item</label>
                  <select
                    id="purchaseInternalItem"
                    required={!newInternalItem}
                    className={inputClass}
                    value={selectedItemId}
                    onChange={(event) => setSelectedItemId(event.target.value)}
                  >
                    <option value="">Select internal item</option>
                    {internalItems.map((item) => (
                      <option key={item.internalItemId} value={item.internalItemId}>
                        {item.itemName} ({item.internalItemId})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
          <div>
            <label htmlFor="purchaseQuantity" className={labelClass}>Quantity</label>
            <input id="purchaseQuantity" type="number" min="1" step="1" required className={inputClass} value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          </div>
          <div>
            <label htmlFor="purchaseBuyingPrice" className={labelClass}>Unit Buying Price (Rs.)</label>
            <input id="purchaseBuyingPrice" type="number" min="0" step="0.01" required className={inputClass} value={buyingPrice} onChange={(event) => setBuyingPrice(event.target.value)} />
          </div>
          <div>
            <label htmlFor="purchaseDate" className={labelClass}>Purchase Date</label>
            <input id="purchaseDate" type="date" required className={inputClass} value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} />
          </div>
          <div className="flex items-end justify-between gap-4">
            <p className="text-sm text-gray-600">Total: <strong>Rs. {total.toLocaleString()}</strong></p>
            <button type="submit" disabled={saving} className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition">
              {saving ? "Recording..." : "Record Purchase"}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Purchase History" description="Purchase entries returned by the existing stock purchase API.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <input aria-label="Search purchases" placeholder="Search purchase, item, source..." className={inputClass} value={search} onChange={(event) => setSearch(event.target.value)} />
          <select aria-label="Filter purchase source" className={inputClass} value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as StockPurchaseSource | "")}>
            <option value="">All sources</option><option value="Supplier">Supplier</option><option value="Shop">Shop</option>
          </select>
          <select aria-label="Filter stock purpose" className={inputClass} value={purposeFilter} onChange={(event) => setPurposeFilter(event.target.value as StockPurchasePurpose | "")}>
            <option value="">All item types</option><option value="Selling">Products</option><option value="Internal">Internal stock</option>
          </select>
        </div>
        {loading ? <p className="py-10 text-center text-gray-500" role="status">Loading purchases...</p> :
          purchases.length === 0 ? <p className="py-10 text-center text-gray-500">No purchase records found.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead><tr className="border-b border-green-100 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-4">Purchase ID</th><th className="px-3 py-4">Supplier / Source</th><th className="px-3 py-4">Item</th><th className="px-3 py-4">Type</th><th className="px-3 py-4">Quantity</th><th className="px-3 py-4">Unit Price</th><th className="px-3 py-4">Total</th><th className="px-3 py-4">Date</th><th className="px-3 py-4">Details</th>
                </tr></thead>
                <tbody className="divide-y divide-green-50">
                  {purchases.map((purchase) => (
                    <tr key={purchase._id} className="hover:bg-green-50/60">
                      <td className="px-3 py-4 text-sm font-semibold">{purchase.purchaseId}</td>
                      <td className="px-3 py-4 text-sm">{purchase.sourceName}</td>
                      <td className="px-3 py-4 text-sm">{purchase.itemName}</td>
                      <td className="px-3 py-4 text-sm">{purchase.stockPurpose === "Selling" ? "Product" : "Internal"}</td>
                      <td className="px-3 py-4 text-sm">{purchase.quantity}</td>
                      <td className="px-3 py-4 text-sm">Rs. {purchase.buyingPrice.toLocaleString()}</td>
                      <td className="px-3 py-4 text-sm">Rs. {purchase.totalAmount.toLocaleString()}</td>
                      <td className="px-3 py-4 text-sm">{new Date(purchase.purchaseDate).toLocaleDateString()}</td>
                      <td className="px-3 py-4"><button type="button" onClick={() => void viewPurchase(purchase)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </SectionCard>
      {selectedPurchase && (
        <Dialog title={`Purchase ${selectedPurchase.purchaseId}`} onClose={() => setSelectedPurchase(null)}>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><dt className="text-gray-500">Source</dt><dd className="mt-1 font-medium">{selectedPurchase.sourceName} ({selectedPurchase.purchaseSource})</dd></div>
            <div><dt className="text-gray-500">Purpose</dt><dd className="mt-1 font-medium">{selectedPurchase.stockPurpose}</dd></div>
            <div><dt className="text-gray-500">Item</dt><dd className="mt-1 font-medium">{selectedPurchase.itemName}</dd></div>
            <div><dt className="text-gray-500">Item ID</dt><dd className="mt-1 font-medium">{selectedPurchase.productId || selectedPurchase.internalItemId || "Not recorded"}</dd></div>
            <div><dt className="text-gray-500">Quantity</dt><dd className="mt-1 font-medium">{selectedPurchase.quantity}</dd></div>
            <div><dt className="text-gray-500">Unit buying price</dt><dd className="mt-1 font-medium">Rs. {selectedPurchase.buyingPrice.toLocaleString()}</dd></div>
            <div><dt className="text-gray-500">Total</dt><dd className="mt-1 font-medium">Rs. {selectedPurchase.totalAmount.toLocaleString()}</dd></div>
            <div><dt className="text-gray-500">Purchase date</dt><dd className="mt-1 font-medium">{new Date(selectedPurchase.purchaseDate).toLocaleString()}</dd></div>
          </dl>
        </Dialog>
      )}
    </div>
  );
};

export default StockPurchase;
