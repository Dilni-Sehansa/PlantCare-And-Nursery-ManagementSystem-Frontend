import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../component/common/Navbar";
import { getUserRole } from "../hooks/useAuth";

type Section =
  | "dashboard"
  | "plants"
  | "products"
  | "orders"
  | "suppliers"
  | "stock"
  | "management-center";

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
                Welcome to the Admin Dashboard
              </h1>

              {activeSection === "dashboard" && (
                <>
                  <p className="text-gray-600 mt-3">
                    Manage nursery plants and products from one place.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                    <Link
                      to="/plants"
                      className="bg-green-50 border border-green-100 rounded-xl p-6 hover:shadow-md transition"
                    >
                      <h2 className="text-xl font-bold text-green-700">Plants</h2>
                      <p className="text-sm text-gray-600 mt-2">
                        View and manage nursery plants.
                      </p>
                      <span className="inline-block text-sm font-semibold text-green-700 mt-4">
                        Manage plants →
                      </span>
                    </Link>
                    <Link
                      to="/admin/products"
                      className="bg-green-50 border border-green-100 rounded-xl p-6 hover:shadow-md transition"
                    >
                      <h2 className="text-xl font-bold text-green-700">Products</h2>
                      <p className="text-sm text-gray-600 mt-2">
                        View and manage nursery products.
                      </p>
                      <span className="inline-block text-sm font-semibold text-green-700 mt-4">
                        Manage products →
                      </span>
                    </Link>
                    <Link
                      to="/admin/suppliers"
                      className="bg-green-50 border border-green-100 rounded-xl p-6 hover:shadow-md transition"
                    >
                      <h2 className="text-xl font-bold text-green-700">Suppliers</h2>
                      <p className="text-sm text-gray-600 mt-2">
                        Manage supplier contacts and status.
                      </p>
                      <span className="inline-block text-sm font-semibold text-green-700 mt-4">
                        Manage suppliers →
                      </span>
                    </Link>
                    <Link
                      to="/admin/stock"
                      className="bg-green-50 border border-green-100 rounded-xl p-6 hover:shadow-md transition"
                    >
                      <h2 className="text-xl font-bold text-green-700">Stock</h2>
                      <p className="text-sm text-gray-600 mt-2">
                        Monitor plant and product quantities.
                      </p>
                      <span className="inline-block text-sm font-semibold text-green-700 mt-4">
                        Manage stock →
                      </span>
                    </Link>
                    <Link
                      to="/admin/management-center"
                      className="bg-green-50 border border-green-100 rounded-xl p-6 hover:shadow-md transition"
                    >
                      <h2 className="text-xl font-bold text-green-700">Management Center</h2>
                      <p className="text-sm text-gray-600 mt-2">
                        Manage purchases, internal stock, usage, and sales.
                      </p>
                      <span className="inline-block text-sm font-semibold text-green-700 mt-4">
                        Open Management Center →
                      </span>
                    </Link>
                  </div>
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
                  <h2 className="text-xl font-bold text-gray-900">Management Center</h2>
                  <p className="mt-2 text-gray-600">
                    Manage stock purchases, internal stock, internal usage, and direct product sales.
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
