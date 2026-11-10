import api from "../service/api";
 
export type ProductCategory =
  | "Fertilizer"
  | "Pesticide"
  | "Medicine"
  | "Seeds"
  | "Other";
 
export type ProductStatus = "Active" | "Inactive";
 
export interface ProductItem {
  _id: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  description: string;
  unit: string;
  buyingPrice: number;
  sellingPrice: number;
  stock: number;
  status: ProductStatus;
}
 
export interface ProductPayload {
  productName: string;
  category: ProductCategory;
  description: string;
  unit: string;
  buyingPrice: number;
  sellingPrice: number;
}
 
export interface ProductQuery {
  search?: string;
  category?: ProductCategory;
  status?: ProductStatus;
}
 
export const getProducts = async (query: ProductQuery) => {
  const res = await api.get("/products", { params: query });
  return {
    count: res.data.count as number,
    products: res.data.products as ProductItem[],
  };
};
 export const createProduct = async (payload: ProductPayload) => {
  const res = await api.post("/products", payload);
  return res.data;
};
 
export const updateProduct = async (id: string, payload: ProductPayload) => {
  const res = await api.patch(`/products/${id}`, payload);
  return res.data;
};
 
export const deactivateProduct = async (id: string) => {
  const res = await api.patch(`/products/${id}/deactivate`);
  return res.data;
};
 
export const activateProduct = async (id: string) => {
  const res = await api.patch(`/products/${id}/activate`);
  return res.data;
};