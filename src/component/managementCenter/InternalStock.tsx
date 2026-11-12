import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  deleteInternalStockItem,
  getInternalStockItems,
  updateInternalStockItem,
} from "../../data/internalStock";
import type {
  InternalStockItem,
  InternalStockPayload,
} from "../../data/internalStock";
import { createStockPurchase } from "../../data/stockPurchase";
import type { StockPurchasePayload } from "../../data/stockPurchase";
import { getSuppliers } from "../../data/suppliers";
import type { SupplierItem } from "../../data/suppliers";
import {
  Alert,
  Dialog,
  ErrorMessage,
  inputClass,
  labelClass,
  SectionCard,
  StatusBadge,
} from "./common";

const emptyForm: InternalStockPayload = {
  itemName: "",
  category: "",
  description: "",
  unit: "",
  stock: 0,
  buyingPrice: 0,
};

const InternalStock = () => {
  const [items, setItems] = useState<InternalStockItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [editingItem, setEditingItem] = useState<InternalStockItem | null>(null);
  const [viewingItem, setViewingItem] = useState<InternalStockItem | null>(null);
  const [form, setForm] = useState<InternalStockPayload>(emptyForm);
  const [purchaseSource, setPurchaseSource] =
    useState<StockPurchasePayload["purchaseSource"]>("Supplier");
  const [supplierId, setSupplierId] = useState("");
  const [shopName, setShopName] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const [stockItems, activeSuppliers] = await Promise.all([
          getInternalStockItems(search),
          getSuppliers({ status: "Active" }),
        ]);
        if (active) {
          setItems(stockItems);
          setSuppliers(activeSuppliers.suppliers);
          if (!supplierId && activeSuppliers.suppliers[0]) {
            setSupplierId(activeSuppliers.suppliers[0].supplierId);
          }
        }
      } catch (loadError) {
        console.error("Error loading internal stock:", loadError);
        if (active) setError(ErrorMessage(loadError, "Could not load internal stock."));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [reloadKey, search]);

  const reset = () => {
    setForm(emptyForm);
    setEditingItem(null);
    setFormError("");
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    if (!form.itemName.trim() || !form.category.trim() || !form.description.trim() || !form.unit.trim()) {
      setFormError("Complete all required item details.");
      return;
    }
    if (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) {
      setFormError("Stock must be a whole number greater than or equal to zero.");
      return;
    }
    if (!Number.isFinite(Number(form.buyingPrice)) || Number(form.buyingPrice) < 0) {
      setFormError("Buying price must be a valid number greater than or equal to zero.");
      return;
    }
    if (!editingItem && purchaseSource === "Supplier" && !supplierId) {
      setFormError("Select an active supplier or choose Shop as the source.");
      return;
    }
    if (!editingItem && purchaseSource === "Shop" && !shopName.trim()) {
      setFormError("Shop name is required.");
      return;
    }
    if (!editingItem && Number(form.stock) < 1) {
      setFormError("A new internal item must be created with a positive purchase quantity.");
      return;
    }

    setSaving(true);
    setFormError("");
    setError("");
    setSuccess("");
    try {
      if (editingItem) {
        await updateInternalStockItem(editingItem.internalItemId, {
          ...form,
          stock: Number(form.stock),
          buyingPrice: Number(form.buyingPrice),
        });
        setSuccess(`"${form.itemName.trim()}" was updated.`);
      } else {
        const payload: StockPurchasePayload = {
          purchaseSource,
          stockPurpose: "Internal",
          itemName: form.itemName.trim(),
          category: form.category.trim(),
          description: form.description.trim(),
          unit: form.unit.trim(),
          quantity: Number(form.stock),
          buyingPrice: Number(form.buyingPrice),
          purchaseDate: new Date().toISOString(),
          ...(purchaseSource === "Supplier"
            ? { supplierId }
            : { sourceName: shopName.trim() }),
        };
        await createStockPurchase(payload);
        setSuccess("Internal stock item was created through a recorded purchase.");
      }
      reset();
      setReloadKey((key) => key + 1);
    } catch (saveError) {
      console.error("Error saving internal stock item:", saveError);
      setFormError(ErrorMessage(saveError, "Could not save internal stock item."));
    } finally {
      setSaving(false);
    }
  };

  const beginEdit = (item: InternalStockItem) => {
    setEditingItem(item);
    setForm({
      itemName: item.itemName,
      category: item.category,
      description: item.description,
      unit: item.unit,
      stock: item.stock,
      buyingPrice: item.buyingPrice,
    });
    setFormError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (item: InternalStockItem) => {
    if (!window.confirm(`Delete "${item.itemName}" (${item.internalItemId})? This cannot be undone.`)) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      await deleteInternalStockItem(item.internalItemId);
      setSuccess(`"${item.itemName}" was deleted.`);
      if (editingItem?._id === item._id) reset();
      if (viewingItem?._id === item._id) setViewingItem(null);
      setReloadKey((key) => key + 1);
    } catch (deleteError) {
      console.error("Error deleting internal stock item:", deleteError);
      setError(ErrorMessage(deleteError, "Could not delete internal stock item."));
    }
  };

  return (
    <div className="space-y-6">
      {success && <Alert type="success">{success}</Alert>}
      {error && <Alert type="error">{error}</Alert>}
      <SectionCard
        title={editingItem ? "Edit Internal Stock Item" : "Add Internal Stock Item"}
        description={
          editingItem
            ? `Update ${editingItem.internalItemId}.`
            : "New items are added through a purchase so stock and purchase history stay consistent."
        }
      >
        {formError && <Alert type="error">{formError}</Alert>}
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={save}>
          <div>
            <label htmlFor="internalItemName" className={labelClass}>Item Name</label>
            <input id="internalItemName" required className={inputClass} value={form.itemName} onChange={(event) => setForm({ ...form, itemName: event.target.value })} />
          </div>
          <div>
            <label htmlFor="internalItemCategory" className={labelClass}>Category</label>
            <input id="internalItemCategory" required className={inputClass} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} />
          </div>
          <div>
            <label htmlFor="internalItemDescription" className={labelClass}>Description</label>
            <input id="internalItemDescription" required className={inputClass} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>
          <div>
            <label htmlFor="internalItemUnit" className={labelClass}>Unit</label>
            <input id="internalItemUnit" required className={inputClass} placeholder="e.g. kg, bag, L" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
          </div>
          <div>
            <label htmlFor="internalItemStock" className={labelClass}>{editingItem ? "Available Stock" : "Opening Quantity"}</label>
            <input id="internalItemStock" type="number" min={editingItem ? "0" : "1"} step="1" required className={inputClass} value={form.stock} onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })} />
          </div>
          <div>
            <label htmlFor="internalItemBuyingPrice" className={labelClass}>Buying Price (Rs.)</label>
            <input id="internalItemBuyingPrice" type="number" min="0" step="0.01" required className={inputClass} value={form.buyingPrice} onChange={(event) => setForm({ ...form, buyingPrice: Number(event.target.value) })} />
          </div>
          {!editingItem && (
            <>
              <div>
                <label htmlFor="internalPurchaseSource" className={labelClass}>Purchase Source</label>
                <select id="internalPurchaseSource" className={inputClass} value={purchaseSource} onChange={(event) => setPurchaseSource(event.target.value as "Supplier" | "Shop")}>
                  <option value="Supplier">Supplier</option><option value="Shop">Shop</option>
                </select>
              </div>
              {purchaseSource === "Supplier" ? (
                <div>
                  <label htmlFor="internalSupplier" className={labelClass}>Active Supplier</label>
                  <select id="internalSupplier" required className={inputClass} value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
                    <option value="">Select supplier</option>
                    {suppliers.map((supplier) => <option key={supplier.supplierId} value={supplier.supplierId}>{supplier.supplierName} ({supplier.supplierId})</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label htmlFor="internalShopName" className={labelClass}>Shop Name</label>
                  <input id="internalShopName" required className={inputClass} value={shopName} onChange={(event) => setShopName(event.target.value)} />
                </div>
              )}
            </>
          )}
          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition">
              {saving ? "Saving..." : editingItem ? "Update Item" : "Add Item and Record Purchase"}
            </button>
            {editingItem && <button type="button" onClick={reset} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition">Cancel</button>}
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Internal Stock Items" description="Nursery supplies and materials, separate from Plants and Products.">
        <div className="mb-5">
          <input type="search" aria-label="Search internal stock" placeholder="Search by item, ID, category..." className={inputClass} value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        {loading ? <p className="py-10 text-center text-gray-500" role="status">Loading internal stock...</p> :
          items.length === 0 ? <p className="py-10 text-center text-gray-500">{search ? "No items match your search." : "No internal stock items found."}</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left">
                <thead><tr className="border-b border-green-100 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-4">Item</th><th className="px-3 py-4">Category</th><th className="px-3 py-4">Available</th><th className="px-3 py-4">Unit</th><th className="px-3 py-4">Status</th><th className="px-3 py-4">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-green-50">
                  {items.map((item) => (
                    <tr key={item._id} className="hover:bg-green-50/60">
                      <td className="px-3 py-4"><p className="font-semibold text-gray-800">{item.itemName}</p><p className="mt-1 text-xs text-gray-500">{item.internalItemId}</p></td>
                      <td className="px-3 py-4 text-sm text-gray-600">{item.category}</td>
                      <td className="px-3 py-4 text-sm font-semibold">{item.stock}</td>
                      <td className="px-3 py-4 text-sm text-gray-600">{item.unit}</td>
                      <td className="px-3 py-4"><StatusBadge stock={item.stock} /></td>
                      <td className="px-3 py-4"><div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setViewingItem(item)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">View</button>
                        <button type="button" onClick={() => beginEdit(item)} className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50">Edit</button>
                        <button type="button" onClick={() => void remove(item)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Delete</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </SectionCard>
      {viewingItem && (
        <Dialog title={viewingItem.itemName} onClose={() => setViewingItem(null)}>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><dt className="text-gray-500">Internal Item ID</dt><dd className="mt-1 font-medium">{viewingItem.internalItemId}</dd></div>
            <div><dt className="text-gray-500">Category</dt><dd className="mt-1 font-medium">{viewingItem.category}</dd></div>
            <div><dt className="text-gray-500">Available stock</dt><dd className="mt-1 font-medium">{viewingItem.stock} {viewingItem.unit}</dd></div>
            <div><dt className="text-gray-500">Buying price</dt><dd className="mt-1 font-medium">Rs. {viewingItem.buyingPrice.toLocaleString()}</dd></div>
            <div className="sm:col-span-2"><dt className="text-gray-500">Description</dt><dd className="mt-1 font-medium">{viewingItem.description}</dd></div>
          </dl>
        </Dialog>
      )}
    </div>
  );
};

export default InternalStock;
