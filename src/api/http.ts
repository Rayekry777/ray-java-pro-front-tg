import axios from "axios";
import type { ApiResult } from "@/types";

const TOKEN_KEY = "ray-admin-token";
export const http = axios.create({ baseURL: import.meta.env.VITE_API_BASE || "/api", timeout: 12000 });

http.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResult<unknown>;
    if (body && typeof body.code === "number" && body.code !== 1 && body.code !== 200) {
      return Promise.reject(new Error(body.msg || "请求未成功"));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem("ray-admin-user");
      if (location.pathname !== "/login") location.assign("/login");
    }
    return Promise.reject(error);
  }
);

export function saveToken(token: string) { sessionStorage.setItem(TOKEN_KEY, token); }
export function clearSession() { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem("ray-admin-user"); }
export function hasToken() { return Boolean(sessionStorage.getItem(TOKEN_KEY)); }
export function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) return error.response?.data?.msg || (error.code === "ECONNABORTED" ? "请求超时，请稍后重试" : error.message);
  return error instanceof Error ? error.message : "发生未知错误";
}
