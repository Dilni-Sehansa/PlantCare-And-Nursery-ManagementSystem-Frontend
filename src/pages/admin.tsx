import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../component/common/Navbar";
import { getUserRole } from "../hooks/useAuth";
import { getPlants } from "../data/plants";
import type { PlantItem } from "../data/plants";
import { getProducts } from "../data/product";
import type { ProductItem } from "../data/product";
import { getOrders } from "../data/orders";
import type { OrderRecord } from "../data/orders";
import { getSuppliers } from "../data/suppliers";

const LOW_STOCK_LIMIT = 10;

type Section =
  | "dashboard"
  | "plants"
  | "products"
  | "orders"
  | "suppliers"
  | "stock"
  | "management-center";

type DashboardData = {
  plants: PlantItem[] | null;
  plantCount: number | null;
  products: ProductItem[] | null;
  productCount: number | null;
  orders: OrderRecord[] | null;
  supplierCount: number | null;
};

const emptyDashboardData: DashboardData = {
  plants: null,
  plantCount: null,
  products: null,
  productCount: null,
  orders: null,
  supplierCount: null,
};

const getAllPlants = async () => {
  const firstPage = await getPlants({ page: 1, limit: 100 });
  const plants = [...firstPage.plants];

  for (let page = 2; page <= firstPage.meta.totalPages; page += 1) {
    const result = await getPlants({ page, limit: 100 });
    plants.push(...result.plants);
  }

  return { plants, count: firstPage.meta.total };
};

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message;
  }
  return error instanceof Error ? error.message : "Could not load this information.";
};

const getOrderCustomer = (order: OrderRecord) => {
  if (!order.user || typeof order.user === "string") return "Customer";
  return (
    [order.user.firstName, order.user.lastName].filter(Boolean).join(" ") ||
    order.user.email ||
    "Customer"
  );
};

const formatOrderDate = (date: string) => {
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime())
    ? "Date unavailable"
    : parsedDate.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

const sectionTitles: Record<Section, string> = {
  dashboard: "Dashboard",
  plants: "Plants",
  products: "Products",
  orders: "Orders",
  suppliers: "Suppliers",
  stock: "Stock Management",
  "management-center": "Management Center",
};

const navItems: { id: Section; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "plants", label: "Plants", icon: "🪴" },
  { id: "products", label: "Products", icon: "📦" },
  { id: "orders", label: "Orders", icon: "🧾" },
  { id: "suppliers", label: "Suppliers", icon: "🚚" },
  { id: "stock", label: "Stock", icon: "📊" },
  { id: "management-center", label: "Management Center", icon: "🗂️" },
];

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
            ? "Only administrators can access this dashboard."
            : "Log in with an administrator account to access this dashboard."}
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

const AdminPage = () => {
  const role = getUserRole();
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [dashboardData, setDashboardData] =
    useState<DashboardData>(emptyDashboardData);
  const [dashboardErrors, setDashboardErrors] = useState<string[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") return;

    let active = true;
    const loadDashboard = async () => {
      setDashboardLoading(true);
      setDashboardData(emptyDashboardData);
      setDashboardErrors([]);

      const results = await Promise.allSettled([
        getAllPlants(),
        getProducts({}),
        getOrders(),
        getSuppliers({}),
      ] as const);

      if (!active) return;

      const errors: string[] = [];
      const [plantsResult, productsResult, ordersResult, suppliersResult] =
        results;
      const plants =
        plantsResult.status === "fulfilled" ? plantsResult.value : null;
      const products =
        productsResult.status === "fulfilled" ? productsResult.value : null;
      const orders =
        ordersResult.status === "fulfilled" ? ordersResult.value : null;
      const suppliers =
        suppliersResult.status === "fulfilled" ? suppliersResult.value : null;

      if (plantsResult.status === "rejected") {
        errors.push(`Plants: ${getErrorMessage(plantsResult.reason)}`);
      }
      if (productsResult.status === "rejected") {
        errors.push(`Products: ${getErrorMessage(productsResult.reason)}`);
      }
      if (ordersResult.status === "rejected") {
        errors.push(`Orders: ${getErrorMessage(ordersResult.reason)}`);
      }
      if (suppliersResult.status === "rejected") {
        errors.push(`Suppliers: ${getErrorMessage(suppliersResult.reason)}`);
      }

      setDashboardData({
        plants: plants?.plants ?? null,
        plantCount: plants?.count ?? null,
        products: products?.products ?? null,
        productCount: products?.count ?? null,
        orders,
        supplierCount: suppliers?.count ?? null,
      });
      setDashboardErrors(errors);
      setDashboardLoading(false);
    };

    void loadDashboard();
    return () => {
      active = false;
    };
  }, [refreshKey, role]);

  const lowStockItems = useMemo(() => {
    if (!dashboardData.plants || !dashboardData.products) return null;

    return [
      ...dashboardData.plants
        .filter((plant) => plant.stock <= LOW_STOCK_LIMIT)
        .map((plant) => ({
          id: plant._id,
          name: plant.name,
          type: "Plant",
          quantity: plant.stock,
          unit: "plants",
        })),
      ...dashboardData.products
        .filter((product) => product.stock <= LOW_STOCK_LIMIT)
        .map((product) => ({
          id: product._id,
          name: product.productName,
          type: "Product",
          quantity: product.stock,
          unit: product.unit,
        })),
    ];
  }, [dashboardData.plants, dashboardData.products]);

  const recentOrders = useMemo(
    () =>
      dashboardData.orders
        ? [...dashboardData.orders]
            .sort(
              (first, second) =>
                new Date(second.createdAt).getTime() -
                new Date(first.createdAt).getTime()
            )
            .slice(0, 5)
        : null,
    [dashboardData.orders]
  );

  const metrics = [
    { title: "Total Plants", value: dashboardData.plantCount, icon: "🪴", href: "/plants" },
    { title: "Total Products", value: dashboardData.productCount, icon: "📦", href: "/admin/products" },
    { title: "Total Orders", value: dashboardData.orders?.length ?? null, icon: "🧾", href: "/admin/orders" },
    { title: "Total Suppliers", value: dashboardData.supplierCount, icon: "🚚", href: "/admin/suppliers" },
    {
      title: "Low Stock Items",
      value: lowStockItems?.filter((item) => item.quantity > 0).length ?? null,
      icon: "⚠️",
      href: "/admin/stock",
    },
    {
      title: "Pending Orders",
      value: dashboardData.orders?.filter((order) => order.status === "PENDING").length ?? null,
      icon: "⏳",
      href: "/admin/orders",
    },
  ];

  const quickActions = [
    { label: "Manage Plants", description: "Update your nursery plants", icon: "🪴", href: "/plants" },
    { label: "Manage Products", description: "Manage care products", icon: "📦", href: "/admin/products" },
    { label: "Manage Orders", description: "Review and process orders", icon: "🧾", href: "/admin/orders" },
    { label: "Manage Suppliers", description: "Maintain supplier details", icon: "🚚", href: "/admin/suppliers" },
    { label: "Manage Stock", description: "Monitor current quantities", icon: "📊", href: "/admin/stock" },
    { label: "Management Center", description: "Purchases, internal stock and sales", icon: "🗂️", href: "/admin/management-center" },
  ];

  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return <AccessDenied loggedIn={role !== null} />;
  }

  return (
    <div className="min-h-screen bg-green-50">
      <Navbar />

      <div className="pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-72 bg-white rounded-2xl shadow-lg border border-green-100 p-4">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.2em] text-green-700 font-semibold">
                NURIX
              </p>
              <h2 className="text-xl font-bold text-gray-800 mt-1">Admin</h2>
            </div>

            <nav className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-2">
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
          </aside>

          <main className="flex-1">
            <section className="bg-white rounded-2xl shadow-lg border border-green-100 p-6 sm:p-8">
              <p className="text-sm font-medium text-green-700">
                {sectionTitles[activeSection]}
              </p>
              <h1 className="text-3xl font-bold text-gray-800 mt-2">
                {activeSection === "dashboard"
                  ? "Welcome to the Admin Dashboard"
                  : sectionTitles[activeSection]}
              </h1>

              {activeSection === "dashboard" && (
                <>
                  <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-gray-600">
                        Here&apos;s an overview of your nursery operations.
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        {new Date().toLocaleDateString(undefined, {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRefreshKey((key) => key + 1)}
                      disabled={dashboardLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span aria-hidden="true">↻</span>
                      {dashboardLoading ? "Refreshing..." : "Refresh"}
                    </button>
                  </div>

                  {dashboardErrors.length > 0 && (
                    <div
                      role="alert"
                      className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
                    >
                      <p className="font-semibold">
                        Some dashboard information could not be loaded.
                      </p>
                      <ul className="mt-2 list-inside list-disc">
                        {dashboardErrors.map((error) => (
                          <li key={error}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {metrics.map((metric) => (
                      <Link
                        key={metric.title}
                        to={metric.href}
                        className="group rounded-2xl border border-green-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">
                            {metric.title}
                          </span>
                          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-2xl">
                            {metric.icon}
                          </span>
                        </div>
                        <p className="mt-4 text-3xl font-bold text-gray-800">
                          {dashboardLoading && metric.value === null
                            ? "…"
                            : metric.value === null
                              ? "—"
                              : metric.value.toLocaleString()}
                        </p>
                        <span className="mt-3 inline-block text-sm font-semibold text-green-700 transition group-hover:text-green-800">
                          View details →
                        </span>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-5">
                    <section className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm xl:col-span-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h2 className="text-xl font-bold text-gray-800">
                            Recent Orders
                          </h2>
                          <p className="mt-1 text-sm text-gray-500">
                            The latest customer orders
                          </p>
                        </div>
                        <Link
                          to="/admin/orders"
                          className="text-sm font-semibold text-green-700 hover:text-green-800"
                        >
                          View all →
                        </Link>
                      </div>

                      {dashboardLoading && !recentOrders ? (
                        <p className="mt-6 text-sm text-gray-500" role="status">
                          Loading recent orders...
                        </p>
                      ) : recentOrders === null ? (
                        <p className="mt-6 text-sm text-gray-500">
                          Recent orders are unavailable.
                        </p>
                      ) : recentOrders.length === 0 ? (
                        <p className="mt-6 rounded-xl bg-green-50 p-4 text-sm text-gray-600">
                          No orders have been placed yet.
                        </p>
                      ) : (
                        <div className="mt-5 overflow-x-auto">
                          <table className="w-full min-w-[560px] text-left text-sm">
                            <thead className="border-b border-green-100 text-xs uppercase tracking-wide text-gray-500">
                              <tr>
                                <th className="px-3 py-3 font-semibold">Order</th>
                                <th className="px-3 py-3 font-semibold">Customer</th>
                                <th className="px-3 py-3 font-semibold">Date</th>
                                <th className="px-3 py-3 font-semibold">Total</th>
                                <th className="px-3 py-3 font-semibold">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-green-50">
                              {recentOrders.map((order) => (
                                <tr key={order._id} className="text-gray-700">
                                  <td className="px-3 py-3 font-semibold text-gray-800">
                                    {order.orderId}
                                  </td>
                                  <td className="px-3 py-3">
                                    {getOrderCustomer(order)}
                                  </td>
                                  <td className="px-3 py-3">
                                    {formatOrderDate(order.createdAt)}
                                  </td>
                                  <td className="px-3 py-3">
                                    Rs. {Number(order.totalAmount).toLocaleString()}
                                  </td>
                                  <td className="px-3 py-3">
                                    <span
                                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                        order.status === "PENDING"
                                          ? "bg-amber-50 text-amber-700"
                                          : order.status === "CANCELLED"
                                            ? "bg-red-50 text-red-700"
                                            : "bg-green-50 text-green-700"
                                      }`}
                                    >
                                      {order.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>

                    <section className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm xl:col-span-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h2 className="text-xl font-bold text-gray-800">
                            Low Stock Alerts
                          </h2>
                          <p className="mt-1 text-sm text-gray-500">
                            Items at or below {LOW_STOCK_LIMIT} units
                          </p>
                        </div>
                        <Link
                          to="/admin/stock"
                          className="text-sm font-semibold text-green-700 hover:text-green-800"
                        >
                          Stock →
                        </Link>
                      </div>

                      {dashboardLoading && lowStockItems === null ? (
                        <p className="mt-6 text-sm text-gray-500" role="status">
                          Loading stock alerts...
                        </p>
                      ) : lowStockItems === null ? (
                        <p className="mt-6 text-sm text-gray-500">
                          Stock alerts are unavailable.
                        </p>
                      ) : lowStockItems.length === 0 ? (
                        <p className="mt-6 rounded-xl bg-green-50 p-4 text-sm text-gray-600">
                          No plants or products need restocking.
                        </p>
                      ) : (
                        <ul className="mt-4 divide-y divide-green-50">
                          {lowStockItems.slice(0, 6).map((item) => (
                            <li
                              key={`${item.type}-${item.id}`}
                              className="flex items-center justify-between gap-3 py-3"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-medium text-gray-800">
                                  {item.name}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  {item.type}
                                </p>
                              </div>
                              <span
                                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  item.quantity === 0
                                    ? "bg-red-50 text-red-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {item.quantity === 0
                                  ? "Out of stock"
                                  : `${item.quantity} ${item.unit}`}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  </div>

                  <section className="mt-8">
                    <h2 className="text-xl font-bold text-gray-800">
                      Quick Actions
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Go directly to a nursery management area.
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {quickActions.map((action) => (
                        <Link
                          key={action.href}
                          to={action.href}
                          className="flex items-start gap-4 rounded-2xl border border-green-100 bg-green-50 p-5 transition hover:-translate-y-0.5 hover:bg-green-100 hover:shadow-sm"
                        >
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                            {action.icon}
                          </span>
                          <span>
                            <span className="block font-semibold text-gray-800">
                              {action.label}
                            </span>
                            <span className="mt-1 block text-sm text-gray-600">
                              {action.description}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {activeSection === "plants" && (
                <div className="mt-6">
                  <p className="text-gray-600">
                    Open the plant management page to manage nursery plants.
                  </p>
                  <Link
                    to="/plants"
                    className="inline-block mt-5 bg-green-700 hover:bg-green-800 text-white font-semibold px-6 py-3 rounded-xl transition"
                  >
                    Go to Plants
                  </Link>
                </div>
              )}

              {activeSection === "products" && (
                <div className="mt-6">
                  <p className="text-gray-600">
                    Open the product management page to manage nursery products.
                  </p>
                  <Link
                    to="/admin/products"
                    className="inline-block mt-5 bg-green-700 hover:bg-green-800 text-white font-semibold px-6 py-3 rounded-xl transition"
                  >
                    Go to Products
                  </Link>
                </div>
              )}

              {activeSection === "orders" && (
                <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 p-6">
                  <h2 className="text-xl font-bold text-gray-900">Order operations</h2>
                  <p className="mt-2 text-gray-600">
                    Review customer orders, update their status, and manage cancelled orders.
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
                <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 p-6">
                  <h2 className="text-xl font-bold text-gray-900">Supplier operations</h2>
                  <p className="mt-2 text-gray-600">
                    Add suppliers, update contact details, and manage active status.
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
                <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 p-6">
                  <h2 className="text-xl font-bold text-gray-900">Stock operations</h2>
                  <p className="mt-2 text-gray-600">
                    Review current plant and product stock, update plant quantities,
                    and record product restocks.
                  </p>
                  <Link
                    to="/admin/stock"
                    className="mt-5 inline-block rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
                  >
                    Open Stock Management
                  </Link>
                </div>
              )}

              {activeSection === "management-center" && (
                <div className="mt-6 rounded-2xl border border-green-100 bg-green-50 p-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Management Center
                  </h2>
                  <p className="mt-2 text-gray-600">
                    Manage stock purchases, internal stock, internal usage, and
                    direct product sales.
                  </p>
                  <Link
                    to="/admin/management-center"
                    className="mt-5 inline-block rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
                  >
                    Open Management Center
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
