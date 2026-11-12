import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { getInternalStockItems } from "../../data/internalStock";
import type { InternalStockItem } from "../../data/internalStock";
import {
  createInternalStockUsage,
  getInternalStockUsage,
  getInternalStockUsages,
} from "../../data/internalStockUsage";
import type { InternalStockUsageItem } from "../../data/internalStockUsage";
import {
  Alert,
  Dialog,
  ErrorMessage,
  inputClass,
  labelClass,
  SectionCard,
} from "./common";

const today = () => new Date().toISOString().slice(0, 10);

const StockUsage = () => {
  const [items, setItems] = useState<InternalStockItem[]>([]);
  const [usages, setUsages] = useState<InternalStockUsageItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [usageDate, setUsageDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedUsage, setSelectedUsage] =
    useState<InternalStockUsageItem | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const [stockItems, usageRows] = await Promise.all([
          getInternalStockItems(),
          getInternalStockUsages({
            search: search || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          }),
        ]);
        if (active) {
          setItems(stockItems);
          setUsages(usageRows);
        }
      } catch (loadError) {
        console.error("Error loading stock usages:", loadError);
        if (active) setError(ErrorMessage(loadError, "Could not load stock usage records."));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [endDate, reloadKey, search, startDate]);

  const selectedItem = items.find((item) => item.internalItemId === selectedItemId);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const parsedQuantity = Number(quantity);
    if (!selectedItem) {
      setFormError("Select an internal stock item.");
      return;
    }
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setFormError("Used quantity must be a positive whole number.");
      return;
    }
    if (parsedQuantity > selectedItem.stock) {
      setFormError(`Quantity exceeds available stock (${selectedItem.stock} ${selectedItem.unit}).`);
      return;
    }

    setSaving(true);
    setFormError("");
    setError("");
    setSuccess("");
    try {
      await createInternalStockUsage({
        internalItemId: selectedItem.internalItemId,
        quantity: parsedQuantity,
        usageDate,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      setSuccess("Stock usage recorded. The backend has deducted the quantity.");
      setQuantity("");
      setUsageDate(today());
      setNotes("");
      setReloadKey((key) => key + 1);
    } catch (submitError) {
      console.error("Error recording stock usage:", submitError);
      setFormError(ErrorMessage(submitError, "Could not record stock usage."));
    } finally {
      setSaving(false);
    }
  };

  const viewUsage = async (usage: InternalStockUsageItem) => {
    try {
      setSelectedUsage(await getInternalStockUsage(usage.usageId));
    } catch (detailError) {
      console.error("Error loading usage details:", detailError);
      setError(ErrorMessage(detailError, "Could not load usage details."));
    }
  };

  return (
    <div className="space-y-6">
      {success && <Alert type="success">{success}</Alert>}
      {error && <Alert type="error">{error}</Alert>}
      <SectionCard
        title="Record Stock Usage"
        description="Usage submission automatically deducts stock. The backend rejects quantities above available stock."
      >
        {formError && <Alert type="error">{formError}</Alert>}
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={submit}>
          <div className="md:col-span-2">
            <label htmlFor="usageItem" className={labelClass}>Internal Stock Item</label>
            <select id="usageItem" required className={inputClass} value={selectedItemId} onChange={(event) => setSelectedItemId(event.target.value)}>
              <option value="">Select an item</option>
              {items.map((item) => (
                <option key={item.internalItemId} value={item.internalItemId} disabled={item.stock <= 0}>
                  {item.itemName} · {item.stock} {item.unit} available
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="usageQuantity" className={labelClass}>Used Quantity</label>
            <input id="usageQuantity" type="number" min="1" max={selectedItem?.stock} step="1" required className={inputClass} value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            {selectedItem && <p className="mt-1 text-xs text-gray-500">Available: {selectedItem.stock} {selectedItem.unit}</p>}
          </div>
          <div>
            <label htmlFor="usageDate" className={labelClass}>Usage Date</label>
            <input id="usageDate" type="date" required className={inputClass} value={usageDate} onChange={(event) => setUsageDate(event.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="usageNotes" className={labelClass}>Reason / Notes (optional)</label>
            <textarea id="usageNotes" rows={3} maxLength={1000} className={inputClass} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Describe the nursery operation or reason for use" />
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={saving || !items.some((item) => item.stock > 0)} className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition">
              {saving ? "Recording..." : "Record Usage"}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Usage History" description="Filter by item, usage ID, or date range.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <input type="search" aria-label="Search usage records" placeholder="Search usage, item..." className={inputClass} value={search} onChange={(event) => setSearch(event.target.value)} />
          <div><label htmlFor="usageStartDate" className={labelClass}>From</label><input id="usageStartDate" type="date" className={inputClass} value={startDate} onChange={(event) => setStartDate(event.target.value)} /></div>
          <div><label htmlFor="usageEndDate" className={labelClass}>To</label><input id="usageEndDate" type="date" min={startDate || undefined} className={inputClass} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></div>
        </div>
        {loading ? <p className="py-10 text-center text-gray-500" role="status">Loading usage history...</p> :
          usages.length === 0 ? <p className="py-10 text-center text-gray-500">No usage records found.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead><tr className="border-b border-green-100 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-4">Usage ID</th><th className="px-3 py-4">Item</th><th className="px-3 py-4">Used Quantity</th><th className="px-3 py-4">Notes</th><th className="px-3 py-4">Usage Date</th><th className="px-3 py-4">Details</th>
                </tr></thead>
                <tbody className="divide-y divide-green-50">
                  {usages.map((usage) => (
                    <tr key={usage._id} className="hover:bg-green-50/60">
                      <td className="px-3 py-4 text-sm font-semibold">{usage.usageId}</td>
                      <td className="px-3 py-4 text-sm">{usage.itemName}<p className="text-xs text-gray-500">{usage.internalItemId}</p></td>
                      <td className="px-3 py-4 text-sm">{usage.quantity} {usage.unit}</td>
                      <td className="px-3 py-4 text-sm text-gray-600 max-w-xs"><span className="line-clamp-2">{usage.notes || "—"}</span></td>
                      <td className="px-3 py-4 text-sm">{new Date(usage.usageDate).toLocaleDateString()}</td>
                      <td className="px-3 py-4"><button type="button" onClick={() => void viewUsage(usage)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </SectionCard>
      {selectedUsage && (
        <Dialog title={`Usage ${selectedUsage.usageId}`} onClose={() => setSelectedUsage(null)}>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><dt className="text-gray-500">Item</dt><dd className="mt-1 font-medium">{selectedUsage.itemName}</dd></div>
            <div><dt className="text-gray-500">Internal Item ID</dt><dd className="mt-1 font-medium">{selectedUsage.internalItemId}</dd></div>
            <div><dt className="text-gray-500">Used quantity</dt><dd className="mt-1 font-medium">{selectedUsage.quantity} {selectedUsage.unit}</dd></div>
            <div><dt className="text-gray-500">Usage date</dt><dd className="mt-1 font-medium">{new Date(selectedUsage.usageDate).toLocaleString()}</dd></div>
            <div className="sm:col-span-2"><dt className="text-gray-500">Notes</dt><dd className="mt-1 font-medium">{selectedUsage.notes || "No notes recorded"}</dd></div>
          </dl>
        </Dialog>
      )}
    </div>
  );
};

export default StockUsage;
