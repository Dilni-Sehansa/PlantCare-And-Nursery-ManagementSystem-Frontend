import api from "../service/api";

export interface InternalStockItem {
  _id: string;
  internalItemId: string;
  itemName: string;
  category: string;
  description: string;
  unit: string;
  stock: number;
  buyingPrice: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface InternalStockPayload {
  itemName: string;
  category: string;
  description: string;
  unit: string;
  stock: number;
  buyingPrice: number;
}

export const getInternalStockItems = async (
  search?: string
): Promise<InternalStockItem[]> => {
  const res = await api.get("/internal-stock", {
    params: search ? { search } : undefined,
  });
  return res.data.items as InternalStockItem[];
};

export const getInternalStockItem = async (
  id: string
): Promise<InternalStockItem> => {
  const res = await api.get(`/internal-stock/${encodeURIComponent(id)}`);
  return res.data.item as InternalStockItem;
};

export const updateInternalStockItem = async (
  id: string,
  payload: InternalStockPayload
) => {
  const res = await api.patch(
    `/internal-stock/${encodeURIComponent(id)}`,
    payload
  );
  return res.data;
};

export const deleteInternalStockItem = async (id: string) => {
  const res = await api.delete(`/internal-stock/${encodeURIComponent(id)}`);
  return res.data;
};
