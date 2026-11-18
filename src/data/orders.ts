import api from "../service/api";
import { getPlants, getImageUrl } from "./plants";
import type { PlantItem } from "./plants";
import { getProducts } from "./product";
import type { ProductItem } from "./product";

export type OrderItemType = "PLANT" | "PRODUCT";
export type OrderStatus = "PENDING" | "PROCESSING" | "CONFIRMED" | "DELIVERED" | "CANCELLED";

export type PaymentMethod = "CARD" | "BANK_TRANSFER" | "COD" | "CASH_AT_NURSERY";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REJECTED";

export interface CatalogItem {
  key: string;
  itemType: OrderItemType;
  id: string;
  mongoId: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
}

export interface OrderItemRecord {
  itemType: OrderItemType;
  plant?: string;
  product?: string;
  plantId?: string;
  plantName?: string;
  plantImage?: string;
  productId?: string;
  productName?: string;
  productImage?: string;
  quantity: number;
  price: number;
}

export interface OrderRecord {
  _id: string;
  orderId: string;
  items: OrderItemRecord[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: string;
  notes?: string;
  createdAt: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentSlipUrl?: string;
  paymentReference?: string;
  paymentDate?: string;
  verifiedBy?: string;
  verifiedAt?: string; 
  user?: string | {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
}

export interface CreateOrderPayload {
  items: {
    itemType: OrderItemType;
    plantId?: string;
    productId?: string;
    quantity: number;
  }[];
  shippingAddress: string;
  notes: string;
  paymentMethod: PaymentMethod;
}

export const getOrderCatalog = async (): Promise<CatalogItem[]> => {
  const allPlants: PlantItem[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const result = await getPlants({ page, limit: 100, upcomingOnly: false }); 
    allPlants.push(...result.plants);
    totalPages = result.meta.totalPages;
    page += 1;
  }

  const productResult = await getProducts({ status: "Active" });

  return [
    ...allPlants.map((plant) => ({
      key: `PLANT:${plant.plantId}`,
      itemType: "PLANT" as const,
      id: plant.plantId,
      mongoId: plant._id,
      name: plant.name,
      category: plant.category.join(", "),
      price: Number(plant.price),
      stock: Number(plant.stock),
      image: getImageUrl(plant.image),
    })),
    ...productResult.products.map((product: ProductItem) => ({
      key: `PRODUCT:${product.productId}`,
      itemType: "PRODUCT" as const,
      id: product.productId,
      mongoId: product._id,
      name: product.productName,
      category: product.category,
      price: Number(product.sellingPrice),
      stock: Number(product.stock),
      image: getImageUrl(product.imageUrl || ""),
    })),
  ];
};

export const createOrder = async (payload: CreateOrderPayload) => {
  const response = await api.post("/orders", payload);
  return response.data.data as OrderRecord;
};

export const downloadOrderPdf = async (orderId: string) => {
  const response = await api.get(`/orders/${encodeURIComponent(orderId)}/pdf`, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "application/pdf" });
  const fileUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = fileUrl;
  link.download = `nurix-order-${orderId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(fileUrl);
};

export const getOrders = async (): Promise<OrderRecord[]> => {
  const orders: OrderRecord[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const response = await api.get("/orders", {
      params: { page, limit: 100 },
    });
    orders.push(...(response.data.data as OrderRecord[]));
    totalPages = Number(response.data.meta?.totalPages) || 1;
    page += 1;
  }

  return orders;
};

export const getOrderById = async (orderId: string): Promise<OrderRecord> => {
  const response = await api.get(`/orders/${encodeURIComponent(orderId)}`);
  return response.data.data as OrderRecord;
};

export const cancelOrder = async (id: string) => {
  const response = await api.patch(`/orders/${encodeURIComponent(id)}/cancel`);
  return response.data;
};

export const updateOrderStatus = async (id: string, status: OrderStatus) => {
  const response = await api.patch(`/orders/${encodeURIComponent(id)}/status`, {
    status,
  });
  return response.data;
};

export const deleteOrder = async (id: string) => {
  const response = await api.delete(`/orders/${encodeURIComponent(id)}`);
  return response.data;
};

export const uploadBankTransferSlip = async (orderId: string,paymentSlip: File) => {
  const formData = new FormData();
  formData.append("paymentSlip", paymentSlip);

  const response = await api.post(
    `/payments/bank-transfer/${encodeURIComponent(orderId)}`,
    formData
  );

  return response.data;
};

export const selectOfflinePayment = async (orderId: string,method: "COD" | "CASH_AT_NURSERY") => {
  const response = await api.post(
    `/payments/${encodeURIComponent(orderId)}/offline-method`,
    {
      paymentMethod: method,
    }
  );

  return response.data;
};

export const getBankTransferSlip = async (orderId: string): Promise<string> => {
  const response = await api.get(
    `/payments/bank-transfer/${encodeURIComponent(orderId)}/slip`
  );
  return response.data.slipUrl as string;
};

export const verifyBankTransfer = async (orderId: string,approved: boolean) => {
  const response = await api.patch(
    `/payments/bank-transfer/${encodeURIComponent(orderId)}/verify`,
    { approved }
  );
  return response.data;
};

export const confirmCODPayment = async (orderId: string) => {
  const response = await api.patch(
    `/payments/cod/${encodeURIComponent(orderId)}/confirm`
  );
  return response.data;
};

export const confirmCashAtNurseryPayment = async (orderId: string) => {
  const response = await api.patch(
    `/payments/cash-at-nursery/${encodeURIComponent(orderId)}/confirm`
  );
  return response.data;
};

export const confirmOrderReceived = async (orderId: string) => {
  const response = await api.patch(
    `/orders/${encodeURIComponent(orderId)}/received`
  );
  return response.data;
};