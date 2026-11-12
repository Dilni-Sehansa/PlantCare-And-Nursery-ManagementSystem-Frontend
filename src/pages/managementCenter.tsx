import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../component/common/Navbar";
import InternalStock from "../component/managementCenter/InternalStock";
import ProductSales from "../component/managementCenter/ProductSales";
import StockPurchase from "../component/managementCenter/StockPurchase";
import StockUsage from "../component/managementCenter/StockUsage";
import { getUserRole } from "../hooks/useAuth";

type ManagementTab = "purchase" | "internal-stock" | "usage" | "sales";

const tabs: { id: ManagementTab; label: string; icon: string }[] = [
  { id: "purchase", label: "Stock Purchase", icon: "🧾" },
  { id: "internal-stock", label: "Internal Stock", icon: "📦" },
  { id: "usage", label: "Stock Usage", icon: "🪴" },
  { id: "sales", label: "Product Sales", icon: "💳" },
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
            ? "Only administrators can access the Management Center."
            : "Log in with an administrator account to access the Management Center."}
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

const ManagementCenterPage = () => {
  const role = getUserRole();
  const [activeTab, setActiveTab] = useState<ManagementTab>("purchase");

  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return <AccessDenied loggedIn={role !== null} />;
  }

  return (
    <div className="min-h-screen bg-green-50">
      <Navbar />
      <section className="bg-[#e8f5e9] pt-28 pb-10 px-6 relative overflow-hidden">
        <div className="absolute -right-16 top-10 w-72 h-72 bg-green-100 rounded-full blur-3xl opacity-60"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/70 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full mb-5 shadow-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Admin · Nursery Management
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 leading-tight mb-4">
            Management <span className="text-green-700">Center</span>
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed mb-6 max-w-2xl">
            Manage nursery purchases, internal materials, stock usage, and direct
            product sales.
          </p>
          <Link
            to="/admin"
            className="inline-block bg-white text-green-700 font-semibold text-sm px-5 py-2.5 rounded-full border border-green-100 shadow-sm hover:bg-green-50 transition"
          >
            ← Back to Admin
          </Link>
        </div>
      </section>

      <main className="py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <nav
            aria-label="Management modules"
            className="grid grid-cols-2 lg:grid-cols-4 gap-2 bg-white rounded-2xl shadow-lg border border-green-100 p-3 mb-6"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-current={activeTab === tab.id ? "page" : undefined}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm sm:text-base font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-green-700 text-white shadow-md"
                    : "bg-green-50 text-gray-700 hover:bg-green-100"
                }`}
              >
                <span aria-hidden="true">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {activeTab === "purchase" && <StockPurchase />}
          {activeTab === "internal-stock" && <InternalStock />}
          {activeTab === "usage" && <StockUsage />}
          {activeTab === "sales" && <ProductSales />}
        </div>
      </main>
    </div>
  );
};

export default ManagementCenterPage;
