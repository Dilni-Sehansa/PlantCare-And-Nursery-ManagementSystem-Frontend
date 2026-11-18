import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../component/common/Navbar";
import { getUserRole } from "../hooks/useAuth";
import { getPlants } from "../data/plants";
import type { PlantItem } from "../data/plants";
import { getProducts } from "../data/product";
import type { ProductItem } from "../data/product";
import { getOrders } from "../data/orders";
import type { OrderRecord, OrderStatus } from "../data/orders";
import { getSuppliers } from "../data/suppliers";
import type { SupplierItem } from "../data/suppliers";


type Section = "dashboard" | "plants" | "products" | "orders" | "suppliers" | "stock";

const sectionTitles: Record<Section, string> = {
  dashboard: "Dashboard",
  plants: "Plants",
  products: "Products",
  orders: "Orders",
  suppliers: "Suppliers",
  stock: "Stock"
};

const navItems: { id: Section; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "plants", label: "Plants", icon: "🪴" },
  { id: "products", label: "Products", icon: "📦" },
  { id: "orders", label: "Orders", icon: "🧾" },
  { id: "suppliers", label: "Suppliers", icon: "🚚" },
  { id: "stock", label: "Stock", icon: "📦"}
];

const LOW_STOCK_THRESHOLD = 10;

const formatPrice = (value: number) =>
  `Rs. ${Number(value || 0).toLocaleString("en-LK")}`;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-LK", {
    timeZone: "Asia/Colombo",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const getAllPlants = async () => {
  const plants: PlantItem[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const result = await getPlants({
      page,
      limit: 100,
      includeUpcoming: true,
    });
    plants.push(...result.plants);
    totalPages = result.meta.totalPages || 1;
    page += 1;
  }

  return plants;
};

const AccessDenied = ({ loggedIn }: { loggedIn: boolean }) => (
  <div className="min-h-screen bg-green-50">
    <Navbar />
    <div className="flex justify-center px-6 pt-32">
      <div className="w-full max-w-md rounded-2xl border border-green-100 bg-white p-10 text-center shadow-lg">
        <div className="mb-4 text-5xl">🔒</div>
        <h1 className="mb-2 text-2xl font-bold text-gray-800">
          {loggedIn ? "Admin access only" : "Please log in"}
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          {loggedIn
            ? "Only administrators can access this dashboard."
            : "Log in with an administrator account to access this dashboard."}
        </p>
        <Link
          to={loggedIn ? "/" : "/login"}
          className="inline-block rounded-xl bg-green-700 px-8 py-3 font-semibold text-white shadow-md transition hover:bg-green-800"
        >
          {loggedIn ? "Back to Home" : "Go to Login"}
        </Link>
      </div>
    </div>
  </div>
);

const BarChart = ({items,maxValue,}: {
  items: { label: string; value: number; color: string }[];
  maxValue: number;
}) => {
  const max = Math.max(maxValue, 1);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const width = Math.round((item.value / max) * 100);
        return (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-gray-700">{item.label}</span>
              <span className="font-semibold text-gray-800">{item.value}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-green-50">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${width}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};


const StockBarChart = ({items,}: {
  items: { label: string; value: number }[];
}) => {
  const maxValue = Math.max(...items.map((item) => item.value), 1);
  const tickStep = Math.max(1, Math.ceil(maxValue / 4));
  const axisMax = tickStep * 4;
  const ticks = Array.from({ length: 5 }, (_, index) => axisMax - index * tickStep);

  return (
    <div
      role="img"
      aria-label="Vertical bar chart of top plants by stock quantity"
      className="relative h-[340px] w-full pt-4"
    >
      <span className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-semibold text-gray-500">
        Stock quantity
      </span>

      <div className="absolute bottom-[76px] left-12 right-2 top-5">
        {ticks.map((tick) => {
          const top = `${((axisMax - tick) / axisMax) * 100}%`;
          return (
            <div
              key={tick}
              className="absolute left-0 right-0 border-t border-dashed border-green-100"
              style={{ top }}
            >
              <span className="absolute right-full top-0 mr-2 -translate-y-1/2 text-[10px] tabular-nums text-gray-500">
                {tick}
              </span>
            </div>
          );
        })}

        <div className="absolute inset-0 flex items-stretch gap-2 sm:gap-4">
          {items.map((item) => {
            const height = Math.max(
              1,
              Math.min(100, (item.value / axisMax) * 100)
            );
            return (
              <div key={item.label} className="relative min-w-0 flex-1">
                <span
                  aria-hidden="true"
                  className="absolute left-0 right-0 z-10 text-center text-[10px] font-semibold tabular-nums text-green-900 sm:text-xs"
                  style={{ bottom: `calc(${height}% + 4px)` }}
                >
                  {item.value.toLocaleString()}
                </span>
                <div
                  tabIndex={0}
                  aria-label={`${item.label}: ${item.value} in stock`}
                  title={`${item.label}: ${item.value} in stock`}
                  className="absolute bottom-0 left-1/2 w-2/3 max-w-14 -translate-x-1/2 rounded-t-md bg-gradient-to-t from-green-800 to-green-500 shadow-sm outline-none transition duration-200 hover:from-green-700 hover:to-green-400 focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
                  style={{ height: `${height}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-8 left-12 right-2 flex gap-2 sm:gap-4">
        {items.map((item) => (
          <span
            key={item.label}
            title={item.label}
            className="min-w-0 flex-1 line-clamp-2 break-words text-center text-[10px] font-medium leading-4 text-gray-600 sm:text-xs"
          >
            {item.label}
          </span>
        ))}
      </div>

      <span className="absolute bottom-1 left-12 right-2 text-center text-[10px] font-semibold text-gray-500">
        Plants
      </span>
    </div>
  );
};

const StatCard = ({
  label,
  value,
  hint,
  accent = "green",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "green" | "amber" | "blue" | "rose";
}) => {
  const accents = {
    green: "from-green-50 to-white border-green-100 text-green-700",
    amber: "from-amber-50 to-white border-amber-100 text-amber-700",
    blue: "from-sky-50 to-white border-sky-100 text-sky-700",
    rose: "from-rose-50 to-white border-rose-100 text-rose-700",
  };

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-5 shadow-sm ${accents[accent]}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-gray-800 sm:text-3xl">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
};


const DashboardContent = ({
  plants,
  products,
  orders,
  suppliers,
  loading,
  error,
  onRefresh,
}: {
  plants: PlantItem[];
  products: ProductItem[];
  orders: OrderRecord[];
  suppliers: SupplierItem[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
}) => {
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => setCurrentTime(Date.now()), 0);
    const refreshTimer = window.setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(refreshTimer);
    };
  }, []);

  const stats = useMemo(() => {
    const lowStockPlants = plants.filter(
      (p) => Number(p.stock) <= LOW_STOCK_THRESHOLD
    );
    const lowStockProducts = products.filter(
      (p) => Number(p.stock) <= LOW_STOCK_THRESHOLD
    );
    const upcoming = plants.filter(
      (p) =>
        p.isUpcoming &&
        p.availableAt &&
        (currentTime === null || new Date(p.availableAt).getTime() > currentTime)
    );

    const statusCounts: Record<OrderStatus, number> = {
      PENDING: 0,
      PROCESSING: 0,
      CONFIRMED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    let revenue = 0;
    for (const order of orders) {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      if (order.status !== "CANCELLED") {
        revenue += Number(order.totalAmount) || 0;
      }
    }

    const activeSuppliers = suppliers.filter((s) => s.status === "Active");

   
    const categoryMap = new Map<string, number>();
    for (const plant of plants) {
      const cat = plant.category?.[0] || "Other";
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    }

    const categoryBars = Array.from(categoryMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const topStock = plants
      .filter((plant) => Number.isFinite(Number(plant.stock)) && Number(plant.stock) > 0)
      .sort((a, b) => Number(b.stock) - Number(a.stock))
      .slice(0, 6)
      .map((p) => ({
        label: p.name,
        value: Number(p.stock) || 0,
      }));

    const recentOrders = [...orders]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);

    return {
      totalPlants: plants.length,
      totalProducts: products.length,
      totalOrders: orders.length,
      totalSuppliers: suppliers.length,
      activeSuppliers: activeSuppliers.length,
      lowStockPlants: lowStockPlants.length,
      lowStockProducts: lowStockProducts.length,
      upcoming: upcoming.length,
      revenue,
      statusCounts,
      categoryBars,
      topStock,
      recentOrders,
      lowStockList: [
        ...lowStockPlants.slice(0, 4).map((p) => ({
          id: p.plantId,
          name: p.name,
          stock: p.stock,
          type: "Plant" as const,
        })),
        ...lowStockProducts.slice(0, 4).map((p) => ({
          id: p.productId,
          name: p.productName,
          stock: p.stock,
          type: "Product" as const,
        })),
      ].slice(0, 6),
    };
  }, [plants, products, orders, suppliers, currentTime]);

  const orderStatusBars = [
    {
      label: "Pending",
      value: stats.statusCounts.PENDING,
      color: "#f59e0b",
    },
    {
      label: "Processing",
      value: stats.statusCounts.PROCESSING,
      color: "#3b82f6",
    },
    {
      label: "Confirmed",
      value: stats.statusCounts.CONFIRMED,
      color: "#0ea5e9",
    },
    {
      label: "Delivered",
      value: stats.statusCounts.DELIVERED,
      color: "#16a34a",
    },
    {
      label: "Cancelled",
      value: stats.statusCounts.CANCELLED,
      color: "#e11d48",
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-green-100 bg-green-50/60"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
        {error}
        <button
          type="button"
          onClick={onRefresh}
          className="ml-3 font-semibold underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
     
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-green-700">Overview</p>
          <h2 className="text-2xl font-bold text-gray-800 sm:text-3xl">
            NURIX Admin Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Live summary of plants, products, orders and suppliers.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-xl border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-800 shadow-sm transition hover:bg-green-50"
        >
          Refresh data
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Plants"
          value={stats.totalPlants}
          hint={`${stats.upcoming} upcoming`}
          accent="green"
        />
        <StatCard
          label="Products"
          value={stats.totalProducts}
          hint="Active catalog"
          accent="blue"
        />
        <StatCard
          label="Orders"
          value={stats.totalOrders}
          hint={`${stats.statusCounts.PENDING} pending`}
          accent="amber"
        />
        <StatCard
          label="Revenue"
          value={formatPrice(stats.revenue)}
          hint="Excluding cancelled"
          accent="green"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Suppliers"
          value={stats.totalSuppliers}
          hint={`${stats.activeSuppliers} active`}
          accent="blue"
        />
        <StatCard
          label="Low stock plants"
          value={stats.lowStockPlants}
          hint={`≤ ${LOW_STOCK_THRESHOLD} units`}
          accent="rose"
        />
        <StatCard
          label="Low stock products"
          value={stats.lowStockProducts}
          hint={`≤ ${LOW_STOCK_THRESHOLD} units`}
          accent="amber"
        />
        <StatCard
          label="Upcoming plants"
          value={stats.upcoming}
          hint="Not yet available"
          accent="green"
        />
      </div>


      <div className="grid gap-5 lg:grid-cols-2">

        <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-green-700">
                Orders
              </p>
              <h3 className="text-lg font-bold text-gray-800">
                Status distribution
              </h3>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-semibold text-green-700 hover:underline"
            >
              Manage →
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No orders yet.
            </p>
          ) : (
            <BarChart
              items={orderStatusBars}
              maxValue={Math.max(
                ...orderStatusBars.map((i) => i.value),
                1
              )}
            />
          )}
        </div>

        <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-wide text-green-700">
              Plants
            </p>
            <h3 className="text-lg font-bold text-gray-800">By category</h3>
          </div>
          {stats.categoryBars.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No plants yet.
            </p>
          ) : (
            <BarChart
              items={stats.categoryBars.map((c, idx) => ({
                label: c.label,
                value: c.value,
                color: ["#16a34a", "#15803d", "#22c55e", "#4ade80", "#86efac", "#bbf7d0"][
                  idx % 6
                ],
              }))}
              maxValue={Math.max(...stats.categoryBars.map((c) => c.value), 1)}
            />
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wide text-green-700">
              Stock
            </p>
            <h3 className="text-lg font-bold text-gray-800">
              Top plants by stock
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Highest available quantities · Top 6
            </p>
          </div>
          {stats.topStock.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No plants currently have stock to display.
            </p>
          ) : (
            <StockBarChart items={stats.topStock} />
          )}
        </div>

        <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-rose-600">
                Alerts
              </p>
              <h3 className="text-lg font-bold text-gray-800">Low stock</h3>
            </div>
            <Link
              to="/plants"
              className="text-xs font-semibold text-green-700 hover:underline"
            >
              View plants →
            </Link>
          </div>

          {stats.lowStockList.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              All items are above the threshold.
            </p>
          ) : (
            <ul className="divide-y divide-green-50">
              {stats.lowStockList.map((item) => (
                <li
                  key={`${item.type}-${item.id}`}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.type} · {item.id}
                    </p>
                  </div>
                  <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600">
                    {item.stock} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-green-700">
              Recent
            </p>
            <h3 className="text-lg font-bold text-gray-800">Latest orders</h3>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-semibold text-green-700 hover:underline"
          >
            All orders →
          </Link>
          
        </div>

        {stats.recentOrders.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            No orders to show.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-green-100 text-xs uppercase tracking-wide text-gray-500">
                  <th className="pb-3 pr-4 font-semibold">Order</th>
                  <th className="pb-3 pr-4 font-semibold">Date</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="border-b border-green-50 last:border-0"
                  >
                    <td className="py-3 pr-4 font-semibold text-gray-800">
                      {order.orderId}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          order.status === "DELIVERED"
                            ? "bg-green-50 text-green-700"
                            : order.status === "CANCELLED"
                              ? "bg-rose-50 text-rose-600"
                              : order.status === "CONFIRMED"
                                ? "bg-sky-50 text-sky-700"
                                : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-gray-800">
                      {formatPrice(order.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            to: "/plants",
            title: "Manage Plants",
            text: "Add, edit and update stock.",
          },
          {
            to: "/admin/products",
            title: "Manage Products",
            text: "Catalog and pricing.",
          },
          {
            to: "/admin/orders",
            title: "Manage Orders",
            text: "Status and fulfilment.",
          },
          {
            to: "/admin/suppliers",
            title: "Manage Suppliers",
            text: "Contacts and status.",
          },
          {
            to: "/admin/srock",
            title: "Manage Stock",
            text: "Inventory and stock updates.",
          },
        ].map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="rounded-2xl border border-green-100 bg-[#E8F5E9] p-5 transition hover:border-green-300 hover:shadow-md"
          >
            <h3 className="font-bold text-green-800">{link.title}</h3>
            <p className="mt-1 text-sm text-gray-600">{link.text}</p>
            <span className="mt-3 inline-block text-sm font-semibold text-green-700">
              Open →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};


const AdminPage = () => {
  const role = getUserRole();
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [plants, setPlants] = useState<PlantItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") return;

    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [allPlants, productResult, allOrders, supplierResult] =
          await Promise.all([
            getAllPlants(),
            getProducts({ status: "Active" }),
            getOrders(),
            getSuppliers({}),
          ]);

        if (!active) return;

        setPlants(allPlants);
        setProducts(productResult.products || []);
        setOrders(allOrders);
        setSuppliers(supplierResult.suppliers || []);
      } catch (err) {
        console.error("Admin dashboard load error:", err);
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load dashboard data."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [role, reloadKey]);

  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return <AccessDenied loggedIn={role !== null} />;
  }

  return (
    <div className="min-h-screen bg-green-50">
      <Navbar />

      <div className="px-4 pb-12 pt-24 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
          <aside className="w-full rounded-2xl border border-green-100 bg-white p-4 shadow-lg lg:w-72">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-700">
                NURIX
              </p>
              <h2 className="mt-1 text-xl font-bold text-gray-800">Admin</h2>
              <p className="mt-1 text-xs text-gray-500">
                Plant Care & Nursery
              </p>
            </div>

            <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                    activeSection === item.id
                      ? "bg-green-700 text-white shadow-md"
                      : "bg-green-50 text-gray-700 hover:bg-green-100"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="mt-6 hidden rounded-xl border border-green-100 bg-[#E8F5E9] p-4 lg:block">
              <p className="text-xs font-semibold text-green-800">Quick tip</p>
              <p className="mt-1 text-xs leading-5 text-gray-600">
                Keep stock updated so the home page and orders stay accurate.
              </p>
            </div>
          </aside>

          <main className="flex-1">
            <section className="rounded-2xl border border-green-100 bg-white p-5 shadow-lg sm:p-8">
              {activeSection === "dashboard" && (
                <DashboardContent
                  plants={plants}
                  products={products}
                  orders={orders}
                  suppliers={suppliers}
                  loading={loading}
                  error={error}
                  onRefresh={() => setReloadKey((k) => k + 1)}
                />
              )}

              {activeSection === "plants" && (
                <div>
                  <p className="text-sm font-medium text-green-700">
                    {sectionTitles.plants}
                  </p>
                  <h1 className="mt-2 text-3xl font-bold text-gray-800">
                    Plant management
                  </h1>
                  <p className="mt-3 text-gray-600">
                    Open the plants page to add, edit, and update nursery
                    plants and stock.
                  </p>
                  <Link
                    to="/plants"
                    className="mt-5 inline-block rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
                  >
                    Go to Plants
                  </Link>
                </div>
              )}

              {activeSection === "products" && (
                <div>
                  <p className="text-sm font-medium text-green-700">
                    {sectionTitles.products}
                  </p>
                  <h1 className="mt-2 text-3xl font-bold text-gray-800">
                    Product management
                  </h1>
                  <p className="mt-3 text-gray-600">
                    Manage fertilizers, tools and other nursery products.
                  </p>
                  <Link
                    to="/admin/products"
                    className="mt-5 inline-block rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
                  >
                    Go to Products
                  </Link>
                </div>
              )}

              {activeSection === "orders" && (
                <div className="rounded-2xl border border-green-100 bg-green-50 p-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Order operations
                  </h2>
                  <p className="mt-2 text-gray-600">
                    Review customer orders, update status, and manage cancelled
                    orders.
                  </p>
                  <Link
                    to="/admin/orders"
                    className="mt-5 inline-block rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
                  >
                    Open Order Management
                  </Link>
                </div>
              )}

              {activeSection === "suppliers" && (
                <div className="rounded-2xl border border-green-100 bg-green-50 p-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Supplier operations
                  </h2>
                  <p className="mt-2 text-gray-600">
                    Add suppliers, update contact details, and manage active
                    status.
                  </p>
                  <Link
                    to="/admin/suppliers"
                    className="mt-5 inline-block rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
                  >
                    Open Supplier Management
                  </Link>
                </div>
              )}

              {activeSection === "stock" && (
                <div className="rounded-2xl border border-green-100 bg-green-50 p-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Stock Management
                  </h2>

                  <p className="mt-2 text-gray-600">
                    Manage stock levels, update quantities, and track stock
                    purchases.
                  </p>

                  <Link
                    to="/admin/stock"
                    className="mt-5 inline-block rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
                  >
                    Open Stock Management
                  </Link>
                </div>
              )}

            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;