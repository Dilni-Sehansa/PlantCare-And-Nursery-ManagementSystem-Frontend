import api from "../service/api";

export interface ProductSaleItem {
  _id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  sellingPrice: number;
  totalAmount: number;
  saleDate: string;
}

export interface ProductSalePayload {
  productId: string;
  quantity: number;
  saleDate: string;
}

export interface ProductSaleQuery {
  search?: string;
  startDate?: string;
  endDate?: string;
}

export const getProductSales = async (
  query: ProductSaleQuery = {}
): Promise<ProductSaleItem[]> => {
  const res = await api.get("/product-sales", { params: query });
  return res.data.sales as ProductSaleItem[];
};

export const getProductSale = async (id: string): Promise<ProductSaleItem> => {
  const res = await api.get(`/product-sales/${encodeURIComponent(id)}`);
  return res.data.sale as ProductSaleItem;
};

export const createProductSale = async (payload: ProductSalePayload) => {
  const res = await api.post("/product-sales", payload);
  return res.data;
};

export const cancelProductSale = async (id: string) => {
  const res = await api.delete(`/product-sales/${encodeURIComponent(id)}`);
  return res.data;
};
