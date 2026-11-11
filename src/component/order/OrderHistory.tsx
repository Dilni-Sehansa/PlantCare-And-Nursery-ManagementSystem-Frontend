import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../common/Navbar";
import OrderImage from "./OrderImage";
import { getUserRole } from "../../hooks/useAuth";
import {
  cancelOrder,
  deleteOrder,
  getOrderCatalog,
  getOrders,
  updateOrderStatus,
} from "../../data/orders";
import type {
  CatalogItem,
  OrderItemRecord,
  OrderRecord,
  OrderStatus,
} from "../../data/orders";

const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "DELIVERED", "CANCELLED"];
const formatPrice = (price: number) => `Rs. ${Number(price).toLocaleString()}`;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }
  return fallback;
};

const statusClass: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-50 text-yellow-800 ring-yellow-200",
  CONFIRMED: "bg-green-50 text-green-700 ring-green-200",
  DELIVERED: "bg-green-100 text-green-800 ring-green-300",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200",
};

const itemImage = (
  item: OrderItemRecord,
  catalogById: Map<string, CatalogItem>
) => {
  const savedImage =
    item.itemType === "PLANT" ? item.plantImage : item.productImage;
  const id =
    item.itemType === "PLANT"
      ? item.plantId || item.plant
      : item.productId || item.product;
  return savedImage || (id ? catalogById.get(id)?.image : "") || "";
};

const itemName = (item: OrderItemRecord) =>
  item.itemType === "PLANT"
    ? item.plantName || "Nursery plant"
    : item.productName || "Plant care product";

const itemCatalogId = (item: OrderItemRecord) =>
  item.itemType === "PLANT"
    ? item.plantId || item.plant || ""
    : item.productId || item.product || "";

const OrderHistory = ({ adminMode = false }: { adminMode?: boolean }) => {
  const role = getUserRole();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [catalogById, setCatalogById] = useState<Map<string, CatalogItem>>(new Map());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedOrder, setExpandedOrder] = useState("");
  const [loading, setLoading] = useState(true);
  const [catalogWarning, setCatalogWarning] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [processingId, setProcessingId] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError("");
        const orderRecords = await getOrders();
        setOrders(orderRecords);
        try {
          const catalog = await getOrderCatalog();
          const entries = new Map<string, CatalogItem>();
          catalog.forEach((item) => {
            entries.set(item.id, item);
            entries.set(item.mongoId, item);
          });
          setCatalogById(entries);
          setCatalogWarning("");
        } catch (catalogError) {
          console.error("Error loading order item images:", catalogError);
          setCatalogWarning("Some older items may not have an image available in the current catalog.");
        }
      } catch (loadError) {
        console.error("Error loading orders:", loadError);
        setError(getErrorMessage(loadError, "Could not load your orders."));
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [reloadKey]);

  const visibleOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
      const matchesSearch =
        !normalizedSearch || order.orderId.toLowerCase().includes(normalizedSearch);
      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const refreshOrders = () => setReloadKey((key) => key + 1);

  const handleCancel = async (order: OrderRecord) => {
    if (!window.confirm(`Cancel order ${order.orderId}?`)) return;
    try {
      setProcessingId(order.orderId);
      setError("");
      setMessage("");
      const response = await cancelOrder(order.orderId);
      setMessage(response.message || `Order ${order.orderId} was cancelled.`);
      refreshOrders();
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Could not cancel this order."));
    } finally {
      setProcessingId("");
    }
  };

  const handleDelete = async (order: OrderRecord) => {
    if (!window.confirm(`Permanently delete cancelled order ${order.orderId}?`)) return;
    try {
      setProcessingId(order.orderId);
      setError("");
      setMessage("");
      const response = await deleteOrder(order.orderId);
      setMessage(response.message || `Order ${order.orderId} was deleted.`);
      refreshOrders();
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Could not delete this order."));
    } finally {
      setProcessingId("");
    }
  };

  const handleStatusChange = async (
    order: OrderRecord,
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const status = event.target.value as OrderStatus;
    if (status === order.status) return;
    try {
      setProcessingId(order.orderId);
      setError("");
      setMessage("");
      const response = await updateOrderStatus(order.orderId, status);
      setMessage(response.message || `Order ${order.orderId} status was updated.`);
      refreshOrders();
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Could not update this order."));
      refreshOrders();
    } finally {
      setProcessingId("");
    }
  };

  if (!role || (adminMode && role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return (
      <div className="min-h-screen bg-green-50">
        <Navbar />
        <main className="mx-auto max-w-xl px-5 pb-20 pt-32 text-center">
          <div className="rounded-2xl border border-green-100 bg-white p-8 shadow-lg sm:p-10">
            <div className="text-5xl">🔐</div>
            <h1 className="mt-4 text-2xl font-bold text-gray-800">{role ? "Admin access only" : "Please sign in first"}</h1>
            <p className="mt-2 text-gray-600">{role ? "Only administrators can manage all orders." : "Sign in to view your order history."}</p>
            <Link to={role ? "/" : "/login"} className="mt-6 inline-block rounded-full bg-green-700 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-green-800">{role ? "Back to home" : "Go to login"}</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 text-gray-800">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-2xl border border-green-100 bg-[#e8f5e9] px-6 py-9 shadow-lg sm:px-10">
          <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-green-100 opacity-70 blur-3xl" />
          <div className="relative">
          <p className="mb-3 inline-flex rounded-full bg-white/70 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.2em] text-green-700 shadow-sm">{adminMode ? "NURIX · Operations" : "NURIX · Your growing journey"}</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">{adminMode ? "Order management" : "My orders"}</h1>
              <p className="mt-2 max-w-2xl text-gray-600">{adminMode ? "Keep every nursery delivery moving, from fresh order to doorstep." : "Follow your plants and care essentials from our nursery to your home."}</p>
            </div>
            {!adminMode && (
              <Link to="/orders" className="rounded-full bg-green-700 px-5 py-3 text-center font-semibold text-white shadow-md transition hover:bg-green-800 hover:shadow-lg">Continue shopping</Link>
            )}
          </div>
          </div>
        </section>

        {(error || message || catalogWarning) && (
          <div className="mt-5 space-y-3">
            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-800">{error}</div>}
            {message && <div role="status" className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-800">{message}</div>}
            {catalogWarning && <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">{catalogWarning}</div>}
          </div>
        )}

        <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-green-100 bg-white p-5 shadow-lg sm:flex-row">
          <label className="sr-only" htmlFor="order-id-search">Search order ID</label>
          <input id="order-id-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by Order ID..." className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 outline-none transition focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-200" />
          <label className="sr-only" htmlFor="order-status-filter">Filter by status</label>
          <select id="order-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200">
            <option value="ALL">All statuses</option>
            {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <button type="button" onClick={refreshOrders} className="rounded-full border border-green-200 px-5 py-3 font-semibold text-green-700 transition hover:border-green-300 hover:bg-green-50">↻ Refresh</button>
        </div>

        {loading ? (
          <div className="mt-6 rounded-2xl border border-green-100 bg-white p-12 text-center text-gray-600 shadow-lg">Loading order details...</div>
        ) : visibleOrders.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-green-100 bg-white p-12 text-center shadow-lg">
            <div className="text-5xl">🌱</div>
            <h2 className="mt-4 text-xl font-bold text-gray-800">{orders.length ? "No orders match your search" : "Your order story starts here"}</h2>
            <p className="mt-2 text-gray-600">{orders.length ? "Try another Order ID or status." : "Choose a plant or product and it will appear here after checkout."}</p>
            {!adminMode && <Link to="/orders" className="mt-5 inline-block rounded-full bg-green-700 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-green-800">Explore the nursery</Link>}
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {visibleOrders.map((order) => {
              const isExpanded = expandedOrder === order.orderId;
              const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
              const customer = typeof order.user === "object" ? order.user : undefined;
              const canCancel = order.status !== "CANCELLED" && order.status !== "DELIVERED";
              const canDelete = adminMode && order.status === "CANCELLED";

              return (
                <article key={order._id} className="overflow-hidden rounded-2xl border border-green-100 bg-white shadow-lg transition duration-200 hover:border-green-300 hover:shadow-xl">
                  <div className="p-5 sm:p-7">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 flex-1 gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-2xl">📦</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-xl font-bold text-gray-800">{order.orderId}</h2>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusClass[order.status]}`}>{order.status}</span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{new Date(order.createdAt).toLocaleString()} · {order.items.length} different item{order.items.length === 1 ? "" : "s"} · {itemCount} total quantity</p>
                          {adminMode && customer && (
                            <p className="mt-1 text-sm font-medium text-gray-700">{customer.firstName} {customer.lastName} · {customer.email || customer.phone}</p>
                          )}
                          <div className="mt-4 flex flex-wrap gap-2">
                            {order.items.slice(0, 5).map((item, index) => (
                              <div key={`${order.orderId}-${itemCatalogId(item)}-${index}`} className="h-14 w-14 overflow-hidden rounded-xl border border-green-100 bg-green-50" title={itemName(item)}>
                                <OrderImage src={itemImage(item, catalogById)} alt={itemName(item)} compact />
                              </div>
                            ))}
                            {order.items.length > 5 && <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-50 text-sm font-bold text-green-800">+{order.items.length - 5}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                        <div className="min-w-32 rounded-2xl bg-green-50 px-4 py-3 text-right">
                          <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Order total</p>
                          <p className="mt-1 text-xl font-bold text-green-800">{formatPrice(order.totalAmount)}</p>
                        </div>
                        {adminMode && order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
                          <label className="sr-only" htmlFor={`status-${order._id}`}>Update status for {order.orderId}</label>
                        )}
                        {adminMode && order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
                          <select id={`status-${order._id}`} value={order.status} disabled={processingId === order.orderId} onChange={(event) => handleStatusChange(order, event)} className="rounded-xl border border-green-200 bg-white px-3 py-3 text-sm font-semibold text-green-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 disabled:opacity-50">
                            {STATUSES.filter((status) => status !== "CANCELLED").map((status) => <option key={status} value={status}>{status}</option>)}
                          </select>
                        )}
                        {canCancel && (
                          <button type="button" onClick={() => handleCancel(order)} disabled={processingId === order.orderId} className="rounded-full border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50">
                            {processingId === order.orderId ? "Working..." : "Cancel order"}
                          </button>
                        )}
                        {canDelete && (
                          <button type="button" onClick={() => handleDelete(order)} disabled={processingId === order.orderId} className="rounded-full border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50">Delete</button>
                        )}
                      </div>
                    </div>

                    <button type="button" aria-expanded={isExpanded} onClick={() => setExpandedOrder(isExpanded ? "" : order.orderId)} className="mt-5 flex w-full items-center justify-between border-t border-green-100 pt-4 text-left text-sm font-semibold text-green-700 transition hover:text-green-800">
                      <span>{isExpanded ? "Hide order details" : "View order details"}</span>
                      <span className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}>⌄</span>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-green-100 bg-green-50 p-5 sm:p-7">
                      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
                        <div>
                          <h3 className="mb-3 font-bold text-gray-800">Items in this order</h3>
                          <div className="space-y-3">
                            {order.items.map((item, index) => (
                              <div key={`${order.orderId}-detail-${itemCatalogId(item)}-${index}`} className="flex flex-col gap-3 rounded-xl border border-green-100 bg-white p-3 shadow-md transition hover:border-green-300 sm:flex-row sm:items-center">
                                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-green-50">
                                  <OrderImage src={itemImage(item, catalogById)} alt={itemName(item)} compact />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-gray-800">{itemName(item)}</p>
                                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-green-700">{item.itemType === "PLANT" ? "Plant" : "Product"}</p>
                                  <p className="mt-1 text-sm text-gray-500">{formatPrice(item.price)} each · Quantity {item.quantity}</p>
                                </div>
                                <p className="font-bold text-gray-800">{formatPrice(item.price * item.quantity)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-md">
                            <h3 className="font-bold text-gray-800">Delivery address</h3>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{order.shippingAddress}</p>
                          </div>
                          {order.notes && <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-md"><h3 className="font-bold text-gray-800">Order notes</h3><p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{order.notes}</p></div>}
                          {adminMode && customer && <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-md"><h3 className="font-bold text-gray-800">Customer</h3><p className="mt-2 text-sm text-gray-600">{customer.firstName} {customer.lastName}</p><p className="text-sm text-gray-600">{customer.email}</p><p className="text-sm text-gray-600">{customer.phone}</p></div>}
                          <div className="rounded-2xl border border-green-100 bg-[#e8f5e9] p-5 text-gray-800">
                            <p className="text-sm text-green-700">{itemCount} items · {order.status}</p>
                            <div className="mt-2 flex justify-between text-lg font-bold"><span>Total</span><span className="text-green-700">{formatPrice(order.totalAmount)}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default OrderHistory;
