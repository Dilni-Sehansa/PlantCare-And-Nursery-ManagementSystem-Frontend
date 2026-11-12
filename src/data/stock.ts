import api from "../service/api";

export type PurchaseSource = "Supplier" | "Shop";

export interface StockPurchaseItem {
  _id: string;
  purchaseId: string;
  purchaseSource: PurchaseSource;
  stockPurpose: "Selling" | "Internal";
  supplierId?: string;
  sourceName: string;
  productId?: string;
  itemName: string;
  quantity: number;
  buyingPrice: number;
  totalAmount: number;
  purchaseDate: string;
}

export interface StockPurchasePayload {
  purchaseSource: PurchaseSource;
  stockPurpose: "Selling";
  supplierId?: string;
  sourceName?: string;
  productId: string;
  quantity: number;
  buyingPrice: number;
}

export const updatePlantStock = async (id: string, stock: number) => {
  const res = await api.patch(`/plants/${encodeURIComponent(id)}/stock`, {
    stock,
  });
  return res.data;
};

export const createStockPurchase = async (payload: StockPurchasePayload) => {
  const res = await api.post("/stock-purchases", payload);
  return res.data;
};

export const getStockPurchases = async (stockPurpose: "Selling") => {
  const res = await api.get("/stock-purchases", { params: { stockPurpose } });
  return res.data.purchases as StockPurchaseItem[];
};
