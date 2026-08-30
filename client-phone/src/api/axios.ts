//src/api/axios.ts

import axios, { AxiosInstance } from "axios";


const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});


// Simple token storage helpers
const TOKEN_KEY = "bragboard_access_token";


export function setAccessToken(token: string | null) {
if (token) localStorage.setItem(TOKEN_KEY, token);
else localStorage.removeItem(TOKEN_KEY);
}


export function getAccessToken(): string | null {
return localStorage.getItem(TOKEN_KEY);
}


// Attach token to requests automatically
axiosInstance.interceptors.request.use((config) => {
const token = getAccessToken();
if (token && config.headers) {
config.headers["Authorization"] = `Bearer ${token}`;
}
return config;
});


// Optional: handle 401s globally (caller can override)
axiosInstance.interceptors.response.use(
(res) => res,
(error) => {
// Example: if unauthorized, clear token and propagate error for App-level handling
if (error?.response?.status === 401) {
setAccessToken(null);
}
return Promise.reject(error);
}
);


export default axiosInstance;