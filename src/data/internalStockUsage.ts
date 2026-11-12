import api from "../service/api";

export interface InternalStockUsageItem {
  _id: string;
  usageId: string;
  internalItemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  usageDate: string;
  notes?: string;
}

export interface InternalStockUsagePayload {
  internalItemId: string;
  quantity: number;
  usageDate: string;
  notes?: string;
}

export interface InternalStockUsageQuery {
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const getInternalStockUsages = async (
  query: InternalStockUsageQuery = {}
): Promise<InternalStockUsageItem[]> => {
  const res = await api.get("/internal-stock-usages", { params: query });
  return res.data.usages as InternalStockUsageItem[];
};

export const getInternalStockUsage = async (
  id: string
): Promise<InternalStockUsageItem> => {
  const res = await api.get(
    `/internal-stock-usages/${encodeURIComponent(id)}`
  );
  return res.data.usage as InternalStockUsageItem;
};

export const createInternalStockUsage = async (
  payload: InternalStockUsagePayload
) => {
  const res = await api.post("/internal-stock-usages", payload);
  return res.data;
};
