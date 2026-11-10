import api from "../service/api";

export type Category = "Indoor" | "Outdoor" | "Indoor & Outdoor";

export interface PlantTypeItem {
  _id: string;
  name: string;
  categories: Category[];
}

export const getPlantTypes = async (category?: Category): Promise<PlantTypeItem[]> => {
  const res = await api.get("/plant-types", {
    params: category ? { category } : {},
  });
  return res.data.data;
};

export const createPlantType = async (name: string, categories: Category[]) => {
  const res = await api.post("/plant-types", { name, categories });
  return res.data;
};