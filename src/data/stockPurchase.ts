import api from "../service/api";

export type StockPurchaseSource = "Supplier" | "Shop";
export type StockPurchasePurpose = "Selling" | "Internal";

export interface StockPurchaseItem {
  _id: string;
  purchaseId: string;
  purchaseSource: StockPurchaseSource;
  stockPurpose: StockPurchasePurpose;
  supplierId?: string;
  sourceName: string;
  productId?: string;
  internalItemId?: string;
  itemName: string;
  quantity: number;
  buyingPrice: number;
  totalAmount: number;
  purchaseDate: string;
}

export interface StockPurchasePayload {
  purchaseSource: StockPurchaseSource;
  stockPurpose: StockPurchasePurpose;
  supplierId?: string;
  sourceName?: string;
  productId?: string;
  internalItemId?: string;
  itemName?: string;
  category?: string;
  description?: string;
  unit?: string;
  quantity: number;
  buyingPrice: number;
  sellingPrice?: number;
  purchaseDate: string;
}

export interface StockPurchaseQuery {
  search?: string;
  purchaseSource?: StockPurchaseSource;
  stockPurpose?: StockPurchasePurpose;
}

export const getStockPurchases = async (
  query: StockPurchaseQuery = {}
): Promise<StockPurchaseItem[]> => {
  const res = await api.get("/stock-purchases", { params: query });
  return res.data.purchases as StockPurchaseItem[];
};

export const getStockPurchaseById = async (
  id: string
): Promise<StockPurchaseItem> => {
  const res = await api.get(`/stock-purchases/${encodeURIComponent(id)}`);
  return res.data.purchase as StockPurchaseItem;
};

export const createStockPurchase = async (
  payload: StockPurchasePayload
) => {
  const res = await api.post("/stock-purchases", payload);
  return res.data;
};
