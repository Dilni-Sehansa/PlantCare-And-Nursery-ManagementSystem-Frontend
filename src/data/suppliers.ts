import api from "../service/api";

export type SupplierStatus = "Active" | "Inactive";

export interface SupplierItem {
  _id: string;
  supplierId: string;
  supplierName: string;
  phone: string;
  email: string;
  address: string;
  status: SupplierStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupplierPayload {
  supplierName: string;
  phone: string;
  email: string;
  address: string;
  status: SupplierStatus;
}

export interface SupplierQuery {
  search?: string;
  status?: SupplierStatus;
}

export const getSuppliers = async (query: SupplierQuery) => {
  const res = await api.get("/suppliers", { params: query });
  return {
    count: res.data.count as number,
    suppliers: res.data.suppliers as SupplierItem[],
  };
};

export const getSupplierById = async (id: string): Promise<SupplierItem> => {
  const res = await api.get(`/suppliers/${encodeURIComponent(id)}`);
  return res.data.supplier as SupplierItem;
};

export const createSupplier = async (payload: SupplierPayload) => {
  const res = await api.post("/suppliers", payload);
  return res.data;
};

export const updateSupplier = async (
  id: string,
  payload: SupplierPayload
) => {
  const res = await api.patch(`/suppliers/${encodeURIComponent(id)}`, payload);
  return res.data;
};

export const deleteSupplier = async (id: string) => {
  const res = await api.delete(`/suppliers/${encodeURIComponent(id)}`);
  return res.data;
};
