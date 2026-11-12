import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios"
import { refreshTokenCall } from "./auth"

const api = axios.create({
    baseURL: "http://localhost:5000/api"
})

const PUBLIC_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
]

type RetryRequestConfig = InternalAxiosRequestConfig & {
  _isRefresh?: boolean;
};

api.interceptors.request.use((config) => { 
    const accessToken = localStorage.getItem("ACCESS_TOKEN")

    const isPublic = PUBLIC_ENDPOINTS.some((url) => config?.url?.includes(url))

    if(!isPublic && accessToken){
        config.headers.Authorization = `Bearer ${accessToken}` 
    }

    return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {

    const originalRequest = error.config as RetryRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isPublic = PUBLIC_ENDPOINTS.some((url) => 
      originalRequest.url?.includes(url)
    );

    if (
      error.response?.status === 401 &&
      !originalRequest._isRefresh &&
      !isPublic
    ) {
      originalRequest._isRefresh = true
      try {
        const refreshToken = localStorage.getItem("REFRESH_TOKEN") as string
        if (!refreshToken) {
          throw new Error("No refresh token available")
        }

        const refreshResponse = await refreshTokenCall(refreshToken)
        const newAccessToken = refreshResponse.accessToken;

        localStorage.setItem("ACCESS_TOKEN", newAccessToken)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

        return axios(originalRequest)
      } catch (err) {
        localStorage.removeItem("ACCESS_TOKEN")
        localStorage.removeItem("REFRESH_TOKEN")
        window.location.href = "/login"
        console.error(err)
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

export default api
