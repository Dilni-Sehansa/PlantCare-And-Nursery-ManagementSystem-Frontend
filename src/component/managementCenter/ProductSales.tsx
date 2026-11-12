import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { getProducts } from "../../data/product";
import type { ProductItem } from "../../data/product";
import {
  cancelProductSale,
  createProductSale,
  getProductSale,
  getProductSales,
} from "../../data/productSales";
import type { ProductSaleItem } from "../../data/productSales";
import {
  Alert,
  Dialog,
  ErrorMessage,
  inputClass,
  labelClass,
  SectionCard,
} from "./common";

const today = () => new Date().toISOString().slice(0, 10);

const ProductSales = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [sales, setSales] = useState<ProductSaleItem[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [saleDate, setSaleDate] = useState(today);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedSale, setSelectedSale] = useState<ProductSaleItem | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const [productResult, saleRows] = await Promise.all([
          getProducts({}),
          getProductSales({
            search: search || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          }),
        ]);
        if (active) {
          setProducts(productResult.products);
          setSales(saleRows);
        }
      } catch (loadError) {
        console.error("Error loading product sales:", loadError);
        if (active) setError(ErrorMessage(loadError, "Could not load product sales."));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [endDate, reloadKey, search, startDate]);

  const selectedProduct = products.find((product) => product.productId === productId);
  const amount = (Number(quantity) || 0) * (selectedProduct?.sellingPrice || 0);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const parsedQuantity = Number(quantity);
    if (!selectedProduct) {
      setFormError("Select an active product.");
      return;
    }
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setFormError("Quantity must be a positive whole number.");
      return;
    }
    if (parsedQuantity > selectedProduct.stock) {
      setFormError(`Quantity exceeds available stock (${selectedProduct.stock}).`);
      return;
    }
    setSaving(true);
    setFormError("");
    setError("");
    setSuccess("");
    try {
      await createProductSale({
        productId: selectedProduct.productId,
        quantity: parsedQuantity,
        saleDate,
      });
      setSuccess("Sale recorded. Product stock has been reduced by the backend.");
      setProductId("");
      setQuantity("");
      setSaleDate(today());
      setReloadKey((key) => key + 1);
    } catch (submitError) {
      console.error("Error creating product sale:", submitError);
      setFormError(ErrorMessage(submitError, "Could not record product sale."));
    } finally {
      setSaving(false);
    }
  };

  const viewSale = async (sale: ProductSaleItem) => {
    try {
      setSelectedSale(await getProductSale(sale.saleId));
    } catch (detailError) {
      console.error("Error loading sale details:", detailError);
      setError(ErrorMessage(detailError, "Could not load sale details."));
    }
  };

  const cancelSale = async (sale: ProductSaleItem) => {
    if (!window.confirm(`Cancel sale ${sale.saleId}? Its quantity will be restored to product stock.`)) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      await cancelProductSale(sale.saleId);
      if (selectedSale?.saleId === sale.saleId) setSelectedSale(null);
      setSuccess(`Sale ${sale.saleId} was cancelled and its stock restored.`);
      setReloadKey((key) => key + 1);
    } catch (cancelError) {
      console.error("Error cancelling product sale:", cancelError);
      setError(ErrorMessage(cancelError, "Could not cancel product sale."));
    }
  };

  return (
    <div className="space-y-6">
      {success && <Alert type="success">{success}</Alert>}
      {error && <Alert type="error">{error}</Alert>}
      <SectionCard
        title="Record Product Sale"
        description="The sale price is read from the selected Product; the backend calculates the total and deducts stock."
      >
        {formError && <Alert type="error">{formError}</Alert>}
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={submit}>
          <div className="md:col-span-2">
            <label htmlFor="saleProduct" className={labelClass}>Product</label>
            <select
              id="saleProduct"
              required
              className={inputClass}
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
            >
              <option value="">Select an active product</option>
              {products.filter((product) => product.status === "Active" && product.stock > 0).map((product) => (
                <option key={product.productId} value={product.productId}>
                  {product.productName} · {product.stock} {product.unit} · Rs. {product.sellingPrice.toLocaleString()}
                </option>
              ))}
            </select>
            {selectedProduct && (
              <p className="mt-2 text-sm text-gray-500">
                Available: {selectedProduct.stock} {selectedProduct.unit} · Unit price: Rs. {selectedProduct.sellingPrice.toLocaleString()}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="saleQuantity" className={labelClass}>Quantity</label>
            <input id="saleQuantity" type="number" min="1" max={selectedProduct?.stock} step="1" required className={inputClass} value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          </div>
          <div>
            <label htmlFor="saleDate" className={labelClass}>Sale Date</label>
            <input id="saleDate" type="date" required className={inputClass} value={saleDate} onChange={(event) => setSaleDate(event.target.value)} />
          </div>
          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-gray-600">Calculated total: <strong>Rs. {amount.toLocaleString()}</strong></p>
            <button type="submit" disabled={saving || !selectedProduct} className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition">
              {saving ? "Recording..." : "Record Sale"}
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Product Sales History" description="Direct sales are separate from customer orders.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <input type="search" aria-label="Search sales" placeholder="Search sale, product..." className={inputClass} value={search} onChange={(event) => setSearch(event.target.value)} />
          <div><label htmlFor="salesStartDate" className={labelClass}>From</label><input id="salesStartDate" type="date" className={inputClass} value={startDate} onChange={(event) => setStartDate(event.target.value)} /></div>
          <div><label htmlFor="salesEndDate" className={labelClass}>To</label><input id="salesEndDate" type="date" min={startDate || undefined} className={inputClass} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></div>
        </div>
        {loading ? <p className="py-10 text-center text-gray-500" role="status">Loading sales...</p> :
          sales.length === 0 ? <p className="py-10 text-center text-gray-500">No product sales found.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead><tr className="border-b border-green-100 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-4">Sale ID</th><th className="px-3 py-4">Product</th><th className="px-3 py-4">Quantity</th><th className="px-3 py-4">Unit Price</th><th className="px-3 py-4">Total</th><th className="px-3 py-4">Sale Date</th><th className="px-3 py-4">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-green-50">
                  {sales.map((sale) => (
                    <tr key={sale._id} className="hover:bg-green-50/60">
                      <td className="px-3 py-4 text-sm font-semibold">{sale.saleId}</td>
                      <td className="px-3 py-4 text-sm">{sale.productName}<p className="text-xs text-gray-500">{sale.productId}</p></td>
                      <td className="px-3 py-4 text-sm">{sale.quantity}</td>
                      <td className="px-3 py-4 text-sm">Rs. {sale.sellingPrice.toLocaleString()}</td>
                      <td className="px-3 py-4 text-sm">Rs. {sale.totalAmount.toLocaleString()}</td>
                      <td className="px-3 py-4 text-sm">{new Date(sale.saleDate).toLocaleDateString()}</td>
                      <td className="px-3 py-4"><div className="flex gap-2">
                        <button type="button" onClick={() => void viewSale(sale)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">View</button>
                        <button type="button" onClick={() => void cancelSale(sale)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Cancel</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </SectionCard>
      {selectedSale && (
        <Dialog title={`Sale ${selectedSale.saleId}`} onClose={() => setSelectedSale(null)}>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><dt className="text-gray-500">Product</dt><dd className="mt-1 font-medium">{selectedSale.productName}</dd></div>
            <div><dt className="text-gray-500">Product ID</dt><dd className="mt-1 font-medium">{selectedSale.productId}</dd></div>
            <div><dt className="text-gray-500">Quantity</dt><dd className="mt-1 font-medium">{selectedSale.quantity}</dd></div>
            <div><dt className="text-gray-500">Unit selling price</dt><dd className="mt-1 font-medium">Rs. {selectedSale.sellingPrice.toLocaleString()}</dd></div>
            <div><dt className="text-gray-500">Total</dt><dd className="mt-1 font-medium">Rs. {selectedSale.totalAmount.toLocaleString()}</dd></div>
            <div><dt className="text-gray-500">Sale date</dt><dd className="mt-1 font-medium">{new Date(selectedSale.saleDate).toLocaleString()}</dd></div>
          </dl>
          <button type="button" onClick={() => void cancelSale(selectedSale)} className="mt-6 rounded-xl border border-red-200 px-5 py-3 font-semibold text-red-600 hover:bg-red-50">Cancel Sale and Restore Stock</button>
        </Dialog>
      )}
    </div>
  );
};

export default ProductSales;
