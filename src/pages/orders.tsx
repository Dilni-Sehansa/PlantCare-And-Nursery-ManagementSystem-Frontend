import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../component/common/Navbar";
import OrderImage from "../component/order/OrderImage";
import { getUserRole } from "../hooks/useAuth";
import { createOrder, getOrderCatalog } from "../data/orders";
import type { CatalogItem, OrderRecord } from "../data/orders";


const formatPrice = (price: number) => `Rs. ${price.toLocaleString()}`;

const getErrorMessage = (error: unknown, fallback: string) => {

  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }

  return fallback;
};



const Orders = () => {
  const role = getUserRole();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [cart, setCart] = useState<{ item: CatalogItem; quantity: number }[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "PLANT" | "PRODUCT">("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [shippingAddress, setShippingAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<OrderRecord | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        setLoading(true);
        setError("");
        setCatalog(await getOrderCatalog());
      } catch (loadError) {
        console.error("Error loading order catalog:", loadError);
        setError(getErrorMessage(loadError, "Could not load plants and products."));
      } finally {
        setLoading(false);
      }
    };

    loadCatalog();
  }, [reloadKey]);

  const categories = useMemo(
    () => Array.from(new Set(catalog.map((item) => item.category).filter(Boolean))),
    [catalog]
  );

  const visibleItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return catalog.filter((item) => {
      const matchesType = typeFilter === "ALL" || item.itemType === typeFilter;
      const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;

      const matchesSearch =
        !normalizedSearch ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.category.toLowerCase().includes(normalizedSearch) ||
        item.id.toLowerCase().includes(normalizedSearch);

      return matchesType && matchesCategory && matchesSearch;

    });

  }, [catalog, categoryFilter, search, typeFilter]);

  const totalQuantity = cart.reduce((total, entry) => total + entry.quantity, 0);
  const totalAmount = cart.reduce(
    (total, entry) => total + entry.item.price * entry.quantity,0
  );

  const addToCart = (item: CatalogItem) => {
    setSuccess(null);
    setCart((currentCart) => {

      const existing = currentCart.find((entry) => entry.item.key === item.key);

      if (existing) {
        return currentCart.map((entry) =>
          entry.item.key === item.key
            ? { ...entry, quantity: Math.min(entry.quantity + 1, item.stock) }
            : entry
        );
      }

      return [...currentCart, { item, quantity: 1 }];

    });
  };

  const changeQuantity = (key: string, amount: number) => {
    setCart((currentCart) =>
      currentCart.map((entry) =>
        entry.item.key === key
          ? {
              ...entry,
              quantity: Math.max(1, Math.min(entry.quantity + amount, entry.item.stock)),
            }
          : entry
      )
    );
  };

  const removeFromCart = (key: string) => {
    setCart((currentCart) => currentCart.filter((entry) => entry.item.key !== key));
  };

  const handlePlaceOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!cart.length) {
      setError("Add at least one plant or product to your order.");
      return;
    }

    if (!shippingAddress.trim()) {
      setError("Please enter a shipping address.");
      return;
    }

    if (cart.some(({ item, quantity }) => quantity < 1 || quantity > item.stock)) {
      setError("One or more selected quantities exceed the available stock. Please review your cart.");
      return;
    }

    try {
      setSubmitting(true);
      const order = await createOrder({
        items: cart.map(({ item, quantity }) => ({
          itemType: item.itemType,
          ...(item.itemType === "PLANT"
            ? { plantId: item.id }
            : { productId: item.id }),
          quantity,
        })),

        shippingAddress: shippingAddress.trim(),
        notes: notes.trim(),
      });

      setSuccess(order);
      setCart([]);
      setShippingAddress("");
      setNotes("");
      setReloadKey((key) => key + 1);
    } catch (submitError) {
      console.error("Error placing order:", submitError);
      setError(getErrorMessage(submitError, "Your order could not be placed."));
    } finally {
      setSubmitting(false);
    }
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-green-50">
        <Navbar />
        <main className="mx-auto max-w-xl px-5 pb-20 pt-32 text-center">
          <div className="rounded-3xl border border-green-100 bg-white p-10 shadow-xl">
            <div className="text-5xl">🔐</div>
            <h1 className="mt-4 text-2xl font-bold text-gray-800">Sign in to place an order</h1>
            <p className="mt-2 text-gray-600">Your nursery basket will be ready when you return.</p>
            <Link to="/login" className="mt-6 inline-block rounded-xl bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800">
              Go to login
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 text-gray-800">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#e8f5e9] px-6 py-10 text-gray-800 shadow-xl sm:px-10 sm:py-14">
          <div className="absolute -right-10 -top-20 h-72 w-72 rounded-full bg-green-100 blur-2xl" />
          <div className="relative max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-green-700">NURIX · The nursery shop</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">Build a little more green into your day.</h1>
            <p className="mt-4 max-w-xl text-gray-600">Choose plants and the care essentials they need. Add everything to one basket and we’ll take it from there.</p>
            
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-green-700">
              <span className="rounded-full border border-green-100 bg-white/70 px-4 py-2">🌱 Fresh nursery plants</span>
              <span className="rounded-full border border-green-100 bg-white/70 px-4 py-2">📦 Care products in one order</span>
            </div>

          </div>
        </section>

        {success && (
          <section className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm" role="status">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>

                <p className="font-bold text-green-700">Your order is growing! Order {success.orderId} was placed successfully.</p>
                <p className="mt-1 text-sm text-green-700">
                  {success.items.length} different item{success.items.length === 1 ? "" : "s"} · {formatPrice(success.totalAmount)} · {success.status}
                </p>

              </div>

              <Link to="/my-orders" className="rounded-xl bg-green-700 px-5 py-3 text-center font-semibold text-white transition hover:bg-green-800">
                Track my order
              </Link>

            </div>
          </section>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-800" role="alert">
            {error}
          </div>
        )}

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)\_390px]">
          <section>
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-green-700">Choose your favorites</p>
                <h2 className="mt-1 text-2xl font-bold text-gray-800">Plants & care essentials</h2>
              </div>
              <span className="text-sm text-gray-500">{visibleItems.length} items to explore</span>
            </div>

            <div className="mb-6 grid gap-3 rounded-2xl border border-green-100 bg-white p-4 shadow-sm sm:grid-cols-[1fr_170px_190px]">
              <label className="sr-only" htmlFor="order-search">Search catalog</label>
              <input
                id="order-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search a plant, product or category..."
                className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none transition focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-200"
              />

              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as "ALL" | "PLANT" | "PRODUCT")} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-green-500">
                <option value="ALL">All item types</option>
                <option value="PLANT">Plants</option>
                <option value="PRODUCT">Products</option>
              </select>

              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 outline-none focus:border-green-500">
                <option value="ALL">All categories</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-green-100 bg-white p-12 text-center text-gray-600 shadow-sm">Gathering the nursery collection...</div>
            ) : visibleItems.length === 0 ? (
              <div className="rounded-2xl border border-green-100 bg-white p-12 text-center shadow-sm">
                <div className="text-4xl">🍃</div>
                <p className="mt-3 font-semibold text-gray-800">No items match those filters</p>
                <button type="button" onClick={() => { setSearch(""); setTypeFilter("ALL"); setCategoryFilter("ALL"); }} className="mt-3 text-sm font-semibold text-green-700 underline">Clear filters</button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {visibleItems.map((item) => {
                  const quantity = cart.find((entry) => entry.item.key === item.key)?.quantity || 0;
                  const unavailable = item.stock <= 0;
                  return (
                    <article key={item.key} className="group overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                      <div className="relative h-56 overflow-hidden bg-green-50">
                        <OrderImage src={item.image} alt={item.name} />
                        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-700 shadow-sm">{item.itemType === "PLANT" ? "Plant" : "Product"}</span>
                        <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${unavailable ? "bg-red-50 text-red-700" : item.stock < 5 ? "bg-amber-50 text-amber-800" : "bg-white/95 text-gray-700"}`}>
                          {unavailable ? "Out of stock" : `${item.stock} in stock`}
                        </span>
                      </div>
                      <div className="p-5">

                        <p className="text-xs font-semibold uppercase tracking-wider text-green-700">{item.category}</p>
                        <h3 className="mt-1 min-h-12 text-lg font-bold text-gray-800">{item.name}</h3>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xl font-bold text-green-700">{formatPrice(item.price)}</span>
                          {quantity > 0 && <span className="text-xs font-semibold text-green-700">{quantity} in basket</span>}
                        </div>

                        <button
                          type="button"
                          onClick={() => addToCart(item)}
                          disabled={unavailable || quantity >= item.stock}
                          className="mt-4 w-full rounded-xl bg-green-700 px-4 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >

                          {unavailable ? "Currently unavailable" : quantity >= item.stock ? "Stock limit reached" : quantity ? "Add one more" : "＋ Add to order"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-3xl border border-green-100 bg-white shadow-lg">
              <div className="bg-green-700 px-6 py-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-100">Your basket</p>
                    <h2 className="mt-1 text-2xl font-bold">Order summary</h2>
                  </div>

                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-xl">🛒</span>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {cart.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-green-200 bg-green-50/70 px-4 py-8 text-center">
                    <div className="text-4xl">🪴</div>
                    <p className="mt-3 font-semibold text-gray-800">Your basket is ready to bloom</p>
                    <p className="mt-1 text-sm text-gray-500">Add plants and products to get started.</p>
                  </div>
                ) : (
                  <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                    {cart.map(({ item, quantity }) => (
                      <article key={item.key} className="flex gap-3 rounded-2xl border border-green-100 bg-green-50 p-3">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-green-50">
                          <OrderImage src={item.image} alt={item.name} compact />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-gray-800">{item.name}</p>
                              <p className="mt-0.5 text-xs text-green-700">{item.itemType === "PLANT" ? "Plant" : "Product"} · {formatPrice(item.price)}</p>
                            </div>
                            <button type="button" onClick={() => removeFromCart(item.key)} className="rounded-lg px-2 py-1 text-sm text-gray-400 transition hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${item.name}`}>✕</button>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="inline-flex items-center gap-3 rounded-lg border border-green-100 bg-white px-2 py-1">
                              <button type="button" onClick={() => changeQuantity(item.key, -1)} className="h-6 w-6 rounded-md font-bold text-green-700 hover:bg-green-50" aria-label={`Decrease ${item.name} quantity`}>−</button>
                              <span className="min-w-4 text-center text-sm font-semibold">{quantity}</span>
                              <button type="button" onClick={() => changeQuantity(item.key, 1)} disabled={quantity >= item.stock} className="h-6 w-6 rounded-md font-bold text-green-700 hover:bg-green-50 disabled:text-gray-300" aria-label={`Increase ${item.name} quantity`}>＋</button>
                            </div>
                            <span className="text-sm font-bold text-gray-800">{formatPrice(item.price * quantity)}</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                <div className="mt-5 space-y-3 border-t border-dashed border-gray-200 pt-5 text-sm">
                  <div className="flex justify-between text-gray-600"><span>Different items</span><span className="font-semibold text-gray-800">{cart.length}</span></div>
                  <div className="flex justify-between text-gray-600"><span>Total quantity</span><span className="font-semibold text-gray-800">{totalQuantity}</span></div>
                  <div className="flex justify-between border-t border-gray-100 pt-3 text-base"><span className="font-bold text-gray-800">Estimated total</span><span className="text-xl font-bold text-green-700">{formatPrice(totalAmount)}</span></div>
                  <p className="text-xs leading-relaxed text-gray-500">Final item prices and stock are verified by the nursery when your order is placed.</p>
                </div>

                <form onSubmit={handlePlaceOrder} className="mt-5 space-y-4 border-t border-green-100 pt-5">
                  <h3 className="font-bold text-gray-800">Delivery details</h3>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="shipping-address">Shipping address <span className="text-red-500">*</span></label>
                  <textarea
                    id="shipping-address"
                    value={shippingAddress}
                    onChange={(event) => setShippingAddress(event.target.value)}
                    required
                    rows={3}
                    maxLength={500}
                    placeholder="House number, street, city and postal code"
                    className="w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-200"
                  />

                  <label className="block text-sm font-medium text-gray-700" htmlFor="order-notes">Order notes <span className="font-normal text-gray-400">(optional)</span></label>
                  <textarea
                    id="order-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={2}
                    maxLength={500}
                    placeholder="Delivery preferences or a note for the nursery"
                    className="w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-200"
                  />

                  <button
                    type="submit"
                    disabled={submitting || cart.length === 0}
                    className="w-full rounded-xl bg-green-700 px-5 py-4 font-bold text-white shadow-md transition hover:bg-green-800 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {submitting ? "Placing your order..." : "Place order"}
                  </button>
                  <Link to="/my-orders" className="block text-center text-sm font-semibold text-green-700 hover:text-green-800">View your previous orders →</Link>
                </form>

              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Orders;
