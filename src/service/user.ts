import api from "./api.ts";

export type Role = "USER" | "ADMIN" | "SUPER_ADMIN";

export interface UserItem {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  totalUsers: number;
  totalAdmins: number;
  activeUsers: number;
  inactiveUsers: number;
  activeAdmins: number;
  inactiveAdmins: number;
  totalAccounts: number;
}

export interface CreateAdminPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export interface UpdateAdminPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export const getAllUsers = async (): Promise<UserItem[]> => {
  const res = await api.get("/users");
  return res.data.users;
};

export const getUserStats = async (): Promise<UserStats> => {
  const res = await api.get("/users/stats");
  return res.data.stats;
};

export const getUserById = async (id: string): Promise<UserItem> => {
  const res = await api.get(`/users/${id}`);
  return res.data.user;
};

export const createAdmin = async (payload: CreateAdminPayload) => {
  const res = await api.post("/users/create-admin", payload);
  return res.data;
};

export const updateAdminDetails = async (
  id: string,
  payload: UpdateAdminPayload
) => {
  const res = await api.patch(`/users/${id}/details`, payload);
  return res.data;
};

export const updateUserRole = async (id: string, role: Role) => {
  const res = await api.patch(`/users/${id}/role`, { role });
  return res.data;
};

export const updateUserStatus = async (id: string, isActive: boolean) => {
  const res = await api.patch(`/users/${id}/status`, { isActive });
  return res.data;
};