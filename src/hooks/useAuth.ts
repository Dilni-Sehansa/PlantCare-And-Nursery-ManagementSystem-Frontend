export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";

export const getUserRole = (): UserRole | null => {
  const token = localStorage.getItem("ACCESS_TOKEN");
  if (!token) return null;

  try {
    const payloadPart = token.split(".")[1];
    const json = atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json);

    if (payload.exp && payload.exp * 1000 < Date.now()) return null;

    if (
      payload.role === "ADMIN" ||
      payload.role === "USER" ||
      payload.role === "SUPER_ADMIN"
    ) {
      return payload.role;
    }
    return null;
  } catch {
    return null;
  }
};