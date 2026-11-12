import api from "../service/api.ts"

export const register = async (firstName:string, lastName:string, email:string, phone: string, password:string) => {
    const res = await api.post("/auth/register", {firstName,lastName,email,phone,password})
    return res.data
}

export const login = async (email:string, password:string) => {
    const res = await api.post("/auth/login", {email,password})
    return res.data
}

export const getMyDetails = async () => {
    const res = await api.get("/auth/me")
    return res.data
}

export const refreshTokenCall = async (refreshToken: string) => {
  const res = await api.post("/auth/refresh", { refreshToken })
  return res.data
}
