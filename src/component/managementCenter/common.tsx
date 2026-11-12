import type { ReactNode } from "react";
import axios from "axios";

export const inputClass =
  "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition bg-gray-50 focus:bg-white";
export const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

export const Alert = ({
  type,
  children,
}: {
  type: "error" | "success";
  children: ReactNode;
}) => (
  <div
    className={`text-sm rounded-xl px-4 py-3 mb-5 border ${
      type === "error"
        ? "bg-red-50 border-red-200 text-red-600"
        : "bg-green-50 border-green-200 text-green-700"
    }`}
    role={type === "error" ? "alert" : "status"}
  >
    {children}
  </div>
);

export const SectionCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) => (
  <section className="bg-white rounded-2xl shadow-lg border border-green-100 p-5 sm:p-8">
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-1">{title}</h2>
      {description && <p className="text-gray-500 text-sm">{description}</p>}
    </div>
    {children}
  </section>
);

export const StatusBadge = ({ stock }: { stock: number }) => {
  const label = stock === 0 ? "Out of stock" : "In stock";
  const style =
    stock === 0
      ? "bg-red-50 text-red-600 border-red-200"
      : "bg-green-50 text-green-700 border-green-200";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${style}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          stock === 0 ? "bg-red-500" : "bg-green-500"
        }`}
      />
      {label}
    </span>
  );
};

export const Dialog = ({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4 py-8"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}
  >
    <section
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="w-full max-w-2xl max-h-full overflow-y-auto rounded-2xl border border-green-100 bg-white p-6 sm:p-8 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <button
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
          className="rounded-lg px-3 py-1 text-2xl leading-none text-gray-500 hover:bg-gray-100 transition"
        >
          ×
        </button>
      </div>
      {children}
    </section>
  </div>
);

export const ErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }
  return fallback;
};
