import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../component/common/Navbar";
import { AlertBox, RoleBadge, StatusBadge} from "../component/superAdmin/badges";
import { getUserRole } from "../hooks/useAuth";
import {
  createAdmin,
  getAllUsers,
  getUserStats,
  updateAdminDetails,
  updateUserRole,
  updateUserStatus,
} from "../service/user";
import type { UpdateAdminPayload, UserItem, UserStats } from "../service/user";

type Section = "dashboard" | "user-management" | "create-admin";
type RoleFilter = "ALL" | "USER" | "ADMIN";
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

const sectionTitles: Record<Section, string> = {
  dashboard: "Dashboard",
  "user-management": "User Management",
  "create-admin": "Create Admin",
};

const navItems: { id: Section; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "user-management", label: "User Management", icon: "👥" },
  { id: "create-admin", label: "Create Admin", icon: "➕" },
];

const emptyAdminForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
};

const emptyEditAdminForm: UpdateAdminPayload = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }

  return fallback;
};

const formatDate = (date?: string) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const AccessDenied = ({ loggedIn }: { loggedIn: boolean }) => (
  <div className="min-h-screen bg-green-50">
    <Navbar />
    <div className="pt-32 px-6 flex justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-green-100 p-10 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {loggedIn ? "Super admin access only" : "Please log in"}
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          {loggedIn
            ? "Only super administrators can manage users and system access."
            : "Log in with a super administrator account to access this page."}
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

const SuperAdminPage = () => {
  const role = getUserRole();

  if (role !== "SUPER_ADMIN") {
    return <AccessDenied loggedIn={role !== null} />;
  }

  return <SuperAdminDashboard />;
};

const SuperAdminDashboard = () => {
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [stats, setStats] = useState<UserStats | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [statsError, setStatsError] = useState("");
  const [usersError, setUsersError] = useState("");
  const [usersSuccess, setUsersSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [adminForm, setAdminForm] = useState(emptyAdminForm);
  const [adminFormError, setAdminFormError] = useState("");
  const [adminFormSuccess, setAdminFormSuccess] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<UserItem | null>(null);
  const [editAdminForm, setEditAdminForm] =
    useState<UpdateAdminPayload>(emptyEditAdminForm);
  const [editAdminError, setEditAdminError] = useState("");
  const [updatingAdmin, setUpdatingAdmin] = useState(false);
  const [accountAction, setAccountAction] = useState<{
    userId: string;
    type: "status" | "role";
  } | null>(null);

  const recentUsers = useMemo(
    () =>
      [...users]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const emailMatch = user.email.toLowerCase().includes(term);
      const phoneMatch = user.phone.toLowerCase().includes(term);
      const nameMatch = fullName.includes(term);
      const roleMatch =
        roleFilter === "ALL" ? true : user.role === roleFilter;
      const statusMatch =
        statusFilter === "ALL"
          ? true
          : statusFilter === "ACTIVE"
            ? user.isActive
            : !user.isActive;

      return (nameMatch || emailMatch || phoneMatch || !term) && roleMatch && statusMatch;
    });
  }, [roleFilter, search, statusFilter, users]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError("");
      const response = await getUserStats();
      setStats(response);
    } catch (error) {
      console.error("Error loading user stats:", error);
      setStatsError(getErrorMessage(error, "Could not load dashboard stats."));
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setUsersError("");
      const response = await getAllUsers();
      setUsers(response);
    } catch (error) {
      console.error("Error loading users:", error);
      setUsersError(getErrorMessage(error, "Could not load users."));
    } finally {
      setUsersLoading(false);
    }
  };

  const refreshDashboard = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchStats(), fetchUsers()]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void refreshDashboard();
  }, []);

  const handleAdminFormChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;
    setAdminForm((prev) => ({ ...prev, [name]: value }));
  };

  const openAdminEditor = (user: UserItem) => {
    if (user.role !== "ADMIN") return;

    setEditingAdmin(user);
    setEditAdminForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
    });
    setEditAdminError("");
    setUsersSuccess("");
  };

  const handleEditAdminFormChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;
    setEditAdminForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingAdmin || updatingAdmin || editingAdmin.role !== "ADMIN") return;

    const payload = {
      firstName: editAdminForm.firstName.trim(),
      lastName: editAdminForm.lastName.trim(),
      email: editAdminForm.email.trim(),
      phone: editAdminForm.phone.trim(),
    };

    setEditAdminError("");

    if (!payload.firstName || !payload.lastName || !payload.email || !payload.phone) {
      setEditAdminError("Please fill in all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      setEditAdminError("Please enter a valid email address.");
      return;
    }

    if (!/^0\d{9}$/.test(payload.phone)) {
      setEditAdminError("Please enter a valid 10-digit phone number.");
      return;
    }

    try {
      setUpdatingAdmin(true);
      await updateAdminDetails(editingAdmin._id, payload);
      setEditingAdmin(null);
      setUsersSuccess("Admin details updated successfully.");
      await fetchUsers();
    } catch (error) {
      console.error("Error updating admin details:", error);
      setEditAdminError(
        getErrorMessage(error, "Could not update admin details.")
      );
    } finally {
      setUpdatingAdmin(false);
    }
  };

  const handleAdminAccountAction = async (
    user: UserItem,
    action: "status" | "role"
  ) => {
    if (user.role !== "ADMIN" || accountAction) return;

    const fullName = `${user.firstName} ${user.lastName}`;
    const nextIsActive = !user.isActive;
    const confirmed =
      action === "status"
        ? window.confirm(
            `${nextIsActive ? "Activate" : "Deactivate"} ${fullName}'s admin account?`
          )
        : window.confirm(
            `Change ${fullName}'s role to User? This account will lose Admin privileges.`
          );

    if (!confirmed) return;

    setUsersError("");
    setUsersSuccess("");
    setAccountAction({ userId: user._id, type: action });

    try {
      if (action === "status") {
        await updateUserStatus(user._id, nextIsActive);
        setUsers((currentUsers) =>
          currentUsers.map((currentUser) =>
            currentUser._id === user._id
              ? { ...currentUser, isActive: nextIsActive }
              : currentUser
          )
        );
        setUsersSuccess(
          `${fullName}'s admin account was ${
            nextIsActive ? "activated" : "deactivated"
          } successfully.`
        );
      } else {
        await updateUserRole(user._id, "USER");
        setUsers((currentUsers) =>
          currentUsers.map((currentUser) =>
            currentUser._id === user._id
              ? { ...currentUser, role: "USER" }
              : currentUser
          )
        );
        setUsersSuccess(`${fullName}'s role was changed to User successfully.`);
      }

      await refreshDashboard();
    } catch (error) {
      console.error("Error updating admin account:", error);
      setUsersError(
        getErrorMessage(error, "Could not update the admin account.")
      );
    } finally {
      setAccountAction(null);
    }
  };

  const handleCreateAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (creatingAdmin) return;

    const trimmedForm = {
      firstName: adminForm.firstName.trim(),
      lastName: adminForm.lastName.trim(),
      email: adminForm.email.trim(),
      phone: adminForm.phone.trim(),
      password: adminForm.password,
    };

    setAdminFormError("");
    setAdminFormSuccess("");

    if (!trimmedForm.firstName || !trimmedForm.lastName || !trimmedForm.email || !trimmedForm.phone || !trimmedForm.password) {
      setAdminFormError("Please fill in all fields.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedForm.email)) {
      setAdminFormError("Please enter a valid email address.");
      return;
    }

    const phonePattern = /^0\d{9}$/;
    if (!phonePattern.test(trimmedForm.phone)) {
      setAdminFormError("Please enter a valid phone number starting with 0.");
      return;
    }

    if (trimmedForm.password.length < 8) {
      setAdminFormError("Password must be at least 8 characters long.");
      return;
    }

    try {
      setCreatingAdmin(true);
      await createAdmin(trimmedForm);
      setAdminFormSuccess("New admin account was created successfully.");
      setAdminForm(emptyAdminForm);
      await refreshDashboard();
    } catch (error) {
      console.error("Error creating admin:", error);
      setAdminFormError(getErrorMessage(error, "Could not create admin account."));
    } finally {
      setCreatingAdmin(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
  };

  const sectionHeader = sectionTitles[activeSection];

  return (
    <div className="min-h-screen bg-green-50">
      <Navbar />

      <div className="pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
          <aside className={`w-full lg:w-72 bg-white rounded-2xl shadow-lg border border-green-100 p-4 ${sidebarOpen ? "block" : "hidden lg:block"}`}>
            <div className="flex items-center justify-between mb-6 lg:mb-8">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-green-700 font-semibold">
                  NURIX
                </p>
                <h2 className="text-xl font-bold text-gray-800 mt-1">
                  Super Admin
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-sm text-gray-600 hover:text-green-700"
              >
                Close
              </button>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-left transition ${
                    activeSection === item.id
                      ? "bg-green-700 text-white shadow-md"
                      : "bg-green-50 text-gray-700 hover:bg-green-100"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span>{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </span>
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1">
            <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-5 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen((prev) => !prev)}
                    className="lg:hidden bg-green-50 text-green-700 border border-green-200 rounded-xl px-3 py-2 font-medium"
                  >
                    Menu
                  </button>
                  <div>
                    <p className="text-sm text-gray-500">Welcome back</p>
                    <h1 className="text-2xl font-bold text-gray-800">Super Admin</h1>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <span className="hidden sm:inline text-sm text-gray-500">
                    {sectionHeader}
                  </span>
                  <button
                    type="button"
                    onClick={() => void refreshDashboard()}
                    disabled={refreshing}
                    className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-medium px-4 py-2.5 rounded-xl transition"
                  >
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
              </div>
            </div>

            {activeSection === "dashboard" && (
              <div className="space-y-6">
                <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {statsLoading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-2xl shadow-lg border border-green-100 p-5 animate-pulse"
                      >
                        <div className="h-4 bg-green-100 rounded w-20 mb-5"></div>
                        <div className="h-8 bg-green-100 rounded w-12 mb-2"></div>
                        <div className="h-4 bg-green-100 rounded w-28"></div>
                      </div>
                    ))
                  ) : stats ? (
                    [
                      {
                        label: "Total Users",
                        value: stats.totalUsers,
                        note: "Registered customers",
                      },
                      {
                        label: "Total Admins",
                        value: stats.totalAdmins,
                        note: "System administrators",
                      },
                      {
                        label: "Active Users",
                        value: stats.activeUsers,
                        note: "Currently active",
                      },
                      {
                        label: "Inactive Users",
                        value: stats.inactiveUsers,
                        note: "Require review",
                      },
                    ].map((card) => (
                      <div
                        key={card.label}
                        className="bg-white rounded-2xl shadow-lg border border-green-100 p-5"
                      >
                        <p className="text-sm font-medium text-gray-500 mb-3">
                          {card.label}
                        </p>
                        <div className="flex items-end justify-between gap-3">
                          <span className="text-3xl font-bold text-gray-800">
                            {card.value}
                          </span>
                          <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
                            {card.note}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : null}
                </section>

                {statsError && <AlertBox type="error" message={statsError} />}

                <section className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-6">
                  <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">
                          Recent User Registrations
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Latest account activity
                        </p>
                      </div>
                    </div>

                    {usersLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <div
                            key={index}
                            className="h-16 bg-green-50 animate-pulse rounded-xl"
                          ></div>
                        ))}
                      </div>
                    ) : recentUsers.length > 0 ? (
                      <div className="space-y-3">
                        {recentUsers.map((user) => (
                          <div
                            key={user._id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-green-100 bg-green-50 rounded-xl p-4"
                          >
                            <div>
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="font-semibold text-gray-800">
                                  {user.firstName} {user.lastName}
                                </h3>
                                <RoleBadge role={user.role} />
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                              <StatusBadge isActive={user.isActive} />
                              <span className="text-xs text-gray-500">
                                {formatDate(user.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-green-200 bg-green-50 p-6 text-center text-gray-500">
                        No recent registrations found.
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-5">
                      Quick Actions
                    </h2>
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setActiveSection("user-management")}
                        className="w-full text-left bg-green-50 hover:bg-green-100 text-green-700 font-medium px-4 py-3 rounded-xl border border-green-100 transition"
                      >
                        View All Users
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSection("create-admin")}
                        className="w-full text-left bg-green-50 hover:bg-green-100 text-green-700 font-medium px-4 py-3 rounded-xl border border-green-100 transition"
                      >
                        Create New Admin
                      </button>
                      <button
                        type="button"
                        onClick={() => void refreshDashboard()}
                        className="w-full text-left bg-green-700 hover:bg-green-800 text-white font-medium px-4 py-3 rounded-xl transition"
                      >
                        Refresh Dashboard
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeSection === "user-management" && (
              <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-5 sm:p-6">
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Search by name, email or phone..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-gray-50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="bg-green-50 border border-green-200 text-green-700 font-medium px-4 py-3 rounded-xl hover:bg-green-100 transition"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Role Filter
                      </label>
                      <select
                        value={roleFilter}
                        onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-gray-50 focus:bg-white"
                      >
                        <option value="ALL">ALL</option>
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Status Filter
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-gray-50 focus:bg-white"
                      >
                        <option value="ALL">ALL</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>
                  </div>
                </div>

                {usersError && <AlertBox type="error" message={usersError} />}
                {usersSuccess && (
                  <AlertBox type="success" message={usersSuccess} />
                )}

                {usersLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-56 bg-green-50 animate-pulse rounded-2xl border border-green-100"
                      ></div>
                    ))}
                  </div>
                ) : filteredUsers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredUsers.map((user) => (
                      <div
                        key={user._id}
                        className="bg-green-50 border border-green-100 rounded-2xl p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">
                              {user.firstName} {user.lastName}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                          </div>
                          <RoleBadge role={user.role} />
                        </div>

                        <div className="mt-4 space-y-3 text-sm text-gray-600">
                          <p>
                            <span className="font-medium text-gray-700">Phone:</span> {user.phone}
                          </p>
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-gray-700">Status</span>
                            <StatusBadge isActive={user.isActive} />
                          </div>
                          <p>
                            <span className="font-medium text-gray-700">Joined:</span>{" "}
                            {formatDate(user.createdAt)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className="mt-5 w-full bg-white border border-green-200 text-green-700 hover:bg-green-100 font-medium px-4 py-2.5 rounded-xl transition"
                        >
                          View Details
                        </button>
                        {user.role === "ADMIN" && (
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => openAdminEditor(user)}
                              disabled={accountAction !== null}
                              className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-medium px-3 py-2.5 rounded-xl transition"
                            >
                              Edit Admin
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void handleAdminAccountAction(user, "status")
                              }
                              disabled={accountAction !== null}
                              className={`font-medium px-3 py-2.5 rounded-xl transition disabled:opacity-60 ${
                                user.isActive
                                  ? "bg-red-50 hover:bg-red-100 border border-red-200 text-red-700"
                                  : "bg-green-50 hover:bg-green-100 border border-green-200 text-green-700"
                              }`}
                            >
                              {accountAction?.userId === user._id &&
                              accountAction.type === "status"
                                ? "Updating..."
                                : user.isActive
                                  ? "Deactivate Admin"
                                  : "Activate Admin"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void handleAdminAccountAction(user, "role")
                              }
                              disabled={accountAction !== null}
                              className="sm:col-span-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 disabled:opacity-60 font-medium px-3 py-2.5 rounded-xl transition"
                            >
                              {accountAction?.userId === user._id &&
                              accountAction.type === "role"
                                ? "Updating..."
                                : "Change Role to User"}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-green-200 bg-green-50 p-8 text-center text-gray-500">
                    No users match your current filters.
                  </div>
                )}
              </div>
            )}

            {activeSection === "create-admin" && (
              <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-5 sm:p-6">
                <div className="max-w-2xl">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Create New Admin
                  </h2>
                  <p className="text-gray-500 text-sm mb-6">
                    Create a new administrator account with access to the management dashboard.
                  </p>

                  {adminFormError && <AlertBox type="error" message={adminFormError} />}
                  {adminFormSuccess && <AlertBox type="success" message={adminFormSuccess} />}

                  <form className="space-y-5" onSubmit={handleCreateAdmin}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          First Name
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={adminForm.firstName}
                          onChange={handleAdminFormChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-gray-50 focus:bg-white"
                          placeholder="Enter first name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Last Name
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={adminForm.lastName}
                          onChange={handleAdminFormChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-gray-50 focus:bg-white"
                          placeholder="Enter last name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={adminForm.email}
                        onChange={handleAdminFormChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-gray-50 focus:bg-white"
                        placeholder="example@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={adminForm.phone}
                        onChange={handleAdminFormChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-gray-50 focus:bg-white"
                        placeholder="0771234567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={adminForm.password}
                        onChange={handleAdminFormChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-gray-50 focus:bg-white"
                        placeholder="Minimum 8 characters"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={creatingAdmin}
                      className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition"
                    >
                      {creatingAdmin ? "Creating Admin..." : "Create Admin"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-green-100 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-green-100">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-green-700 font-semibold">
                  User Profile
                </p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">
                  {selectedUser.firstName} {selectedUser.lastName}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-2xl text-gray-500 hover:text-gray-800"
              >
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-base font-semibold text-gray-800 mt-1">
                  {selectedUser.email}
                </p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-base font-semibold text-gray-800 mt-1">
                  {selectedUser.phone}
                </p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <p className="text-sm text-gray-500">Role</p>
                <div className="mt-2">
                  <RoleBadge role={selectedUser.role} />
                </div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <p className="text-sm text-gray-500">Status</p>
                <div className="mt-2">
                  <StatusBadge isActive={selectedUser.isActive} />
                </div>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-100 sm:col-span-2">
                <p className="text-sm text-gray-500">Registration Date</p>
                <p className="text-base font-semibold text-gray-800 mt-1">
                  {formatDate(selectedUser.createdAt)}
                </p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-100 sm:col-span-2">
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="text-base font-semibold text-gray-800 mt-1">
                  {formatDate(selectedUser.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-green-100 p-6 sm:p-8">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.2em] text-green-700 font-semibold">
                User Management
              </p>
              <h2 className="text-2xl font-bold text-gray-800 mt-1">
                Edit Admin Details
              </h2>
            </div>

            {editAdminError && (
              <AlertBox type="error" message={editAdminError} />
            )}

            <form className="space-y-5" onSubmit={handleUpdateAdmin}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="edit-admin-first-name"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    First Name
                  </label>
                  <input
                    id="edit-admin-first-name"
                    name="firstName"
                    value={editAdminForm.firstName}
                    onChange={handleEditAdminFormChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-gray-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-admin-last-name"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Last Name
                  </label>
                  <input
                    id="edit-admin-last-name"
                    name="lastName"
                    value={editAdminForm.lastName}
                    onChange={handleEditAdminFormChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="edit-admin-email"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Email
                </label>
                <input
                  id="edit-admin-email"
                  name="email"
                  type="email"
                  value={editAdminForm.email}
                  onChange={handleEditAdminFormChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-gray-50 focus:bg-white"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-admin-phone"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Phone Number
                </label>
                <input
                  id="edit-admin-phone"
                  name="phone"
                  type="tel"
                  value={editAdminForm.phone}
                  onChange={handleEditAdminFormChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-gray-50 focus:bg-white"
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAdmin(null);
                    setEditAdminError("");
                  }}
                  disabled={updatingAdmin}
                  className="bg-white border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-60 font-medium px-5 py-3 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingAdmin}
                  className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-xl transition"
                >
                  {updatingAdmin ? "Updating..." : "Update Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminPage;
