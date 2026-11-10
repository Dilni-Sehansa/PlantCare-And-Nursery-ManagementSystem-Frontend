import type { Role } from "../../service/user";

export const StatusBadge = ({ isActive }: { isActive: boolean }) => (
  <span
    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
      isActive
        ? "bg-green-50 text-green-700 border-green-200"
        : "bg-red-50 text-red-600 border-red-200"
    }`}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full ${
        isActive ? "bg-green-500" : "bg-red-500"
      }`}
    ></span>
    {isActive ? "Active" : "Inactive"}
  </span>
);

export const RoleBadge = ({ role }: { role: Role }) => {
  const config =
    role === "SUPER_ADMIN"
      ? "bg-violet-50 text-violet-700 border-violet-200"
      : role === "ADMIN"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-green-50 text-green-700 border-green-100";

  const label =
    role === "SUPER_ADMIN" ? "Super Admin" : role === "ADMIN" ? "Admin" : "User";

  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full border ${config}`}
    >
      {label}
    </span>
  );
};

export const AlertBox = ({
  type,
  message,
}: {
  type: "error" | "success";
  message: string;
}) => (
  <div
    className={`text-sm rounded-xl px-4 py-3 mb-5 border ${
      type === "error"
        ? "bg-red-50 border-red-200 text-red-600"
        : "bg-green-50 border-green-200 text-green-700"
    }`}
  >
    {message}
  </div>
);