import api from "../service/api";
import type { Category } from "./plantType";

export type WaterNeed = "Low" | "Medium" | "High";
export type Sunlight = "Full" | "Indirect" | "Low";

export interface PlantItem {
  _id: string;
  plantId: string;
  name: string;
  description: string;
  category: Category[];
  plantType: string;
  waterNeed: WaterNeed;
  sunlight: Sunlight;
  price: number;
  stock: number;
  image: string;
  careTips: string;
}

export interface PlantMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PlantQuery {
  page?: number;
  limit?: number;
  category?: Category;
  search?: string;
}

export const getPlants = async (query: PlantQuery) => {
  const res = await api.get("/plants", { params: query });
  return {
    plants: res.data.data as PlantItem[],
    meta: res.data.meta as PlantMeta,
  };
};

export const createPlant = async (formData: FormData) => {
  const res = await api.post("/plants", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updatePlant = async (id: string, formData: FormData) => {
  const res = await api.patch(`/plants/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deletePlant = async (id: string) => {
  const res = await api.delete(`/plants/${id}`);
  return res.data;
};

export const getImageUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;

  const base = (api.defaults.baseURL || "http://localhost:5000").replace(
    /\/api\/?$/,
    ""
  );
  return `${base}${path}`;
};