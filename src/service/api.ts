import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"

const api = axios.create({
    baseURL: API_BASE_URL,
})

const PUBLIC_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh-token",
];

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
        const refreshToken = localStorage.getItem("REFRESH_TOKEN")
        if (!refreshToken) {
          throw new Error("No refresh token available")
        }

        // const refreshResponse = await refreshTokenCall(refreshToken)
        const refreshResponse = await axios.post<{accessToken: string;}>(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken }
        )

        const newAccessToken = refreshResponse.data.accessToken;

        if (!newAccessToken) {
          throw new Error("No access token received from refresh")
        }

        localStorage.setItem("ACCESS_TOKEN", newAccessToken)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

        return api(originalRequest)

      } catch (err) {
        localStorage.removeItem("ACCESS_TOKEN")
        localStorage.removeItem("REFRESH_TOKEN")
        window.location.href = "/login"
        console.error("Token refresh failed:", err);
        return Promise.reject(err)
      }
    }
    return Promise.reject(error)
  }
)

export default api
