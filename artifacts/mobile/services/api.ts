import AsyncStorage from "@react-native-async-storage/async-storage";

const getDomain = () => {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (!domain) return "localhost:8080";
  return domain;
};

export const getApiBase = () => `https://${getDomain()}/api`;

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem("auth_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = false
): Promise<T> {
  const base = getApiBase();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${base}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ user: any; token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    register: (name: string, email: string, password: string, phone?: string) =>
      request<{ user: any; token: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, phone }),
      }),
    me: () => request<{ user: any }>("/auth/me", {}, true),
    logout: () => request<{ success: boolean }>("/auth/logout", { method: "POST" }, true),
    updateProfile: (name: string, phone?: string) =>
      request<{ user: any }>("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({ name, phone }),
      }, true),
    changePassword: (currentPassword: string, newPassword: string) =>
      request<{ success: boolean }>("/auth/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      }, true),
  },

  products: {
    list: (params?: { category?: string; search?: string; featured?: boolean; active?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.category) q.set("category", params.category);
      if (params?.search) q.set("search", params.search);
      if (params?.featured !== undefined) q.set("featured", String(params.featured));
      if (params?.active !== undefined) q.set("active", String(params.active));
      const qs = q.toString() ? `?${q.toString()}` : "";
      return request<{ products: any[]; total: number }>(`/products${qs}`);
    },
    get: (id: string) => request<{ product: any }>(`/products/${id}`),
    create: (data: any) => request<{ product: any }>("/products", { method: "POST", body: JSON.stringify(data) }, true),
    update: (id: string, data: any) => request<{ product: any }>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }, true),
    delete: (id: string) => request<{ success: boolean }>(`/products/${id}`, { method: "DELETE" }, true),
  },

  orders: {
    list: (params?: { status?: string }) => {
      const qs = params?.status ? `?status=${params.status}` : "";
      return request<{ orders: any[]; total: number }>(`/orders${qs}`, {}, true);
    },
    get: (id: string) => request<{ order: any }>(`/orders/${id}`, {}, true),
    create: (data: any) => request<{ order: any }>("/orders", { method: "POST", body: JSON.stringify(data) }, true),
    updateStatus: (id: string, status: string, extra?: { courierTrackingId?: string; courierName?: string; notes?: string }) =>
      request<{ order: any }>(`/orders/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status, ...extra }),
      }, true),
  },

  analytics: {
    summary: () => request<any>("/analytics", {}, true),
    users: () => request<{ users: any[]; total: number }>("/analytics/users", {}, true),
    deleteUser: (id: string) => request<{ success: boolean }>(`/analytics/users/${id}`, { method: "DELETE" }, true),
    changeRole: (id: string, role: "user" | "admin") =>
      request<{ user: any }>(`/analytics/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }, true),
  },

  cart: {
    reserve: (variantId: string, quantity: number) =>
      request<{ variant: any }>("/cart/reserve", {
        method: "POST",
        body: JSON.stringify({ variantId, quantity }),
      }, true),
    release: (variantId: string, quantity: number) =>
      request<{ variant: any }>("/cart/release", {
        method: "DELETE",
        body: JSON.stringify({ variantId, quantity }),
      }, true),
    releaseAll: (variantIds: string[]) =>
      request<{ success: boolean }>("/cart/release-all", {
        method: "DELETE",
        body: JSON.stringify({ variantIds }),
      }, true),
  },
};
