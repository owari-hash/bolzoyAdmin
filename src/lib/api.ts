const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://103.236.194.106:9000";

export interface User {
  id: string;
  username: string;
  slug: string;
  role: "tenant" | "superadmin";
  displayName?: string;
}

export type PlanStatus = "new" | "confirmed" | "completed" | "cancelled";

export interface DatePlan {
  _id: string;
  tenantSlug: string;
  name: string;
  date: string;
  time: string;
  foodVenue: "outdoor" | "home" | string;
  foods: string[];
  movieVenue?: "outdoor" | "home" | string;
  status: PlanStatus;
  notes?: string;
  createdAt: string;
}

export interface FoodItem {
  _id: string;
  tenantSlug: string;
  emoji: string;
  name: string;
  type: "outdoor" | "home";
  price?: number;
  category?: string;
  isActive: boolean;
  createdAt: string;
}

export interface TenantUser {
  _id: string;
  username: string;
  slug: string;
  displayName?: string;
  role: string;
  status: "active" | "suspended";
  createdAt: string;
}

export interface AnalyticsData {
  totalPlans: number;
  totalFoods: number;
  statusCounts: {
    new: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  venueRatio: {
    outdoorFood: number;
    homeFood: number;
    outdoorMovie: number;
    homeMovie: number;
  };
  timeDistribution: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  topFoods: Array<{
    id: string;
    emoji: string;
    name: string;
    count: number;
  }>;
}

export interface SuperAdminAnalytics {
  totalTenants: number;
  activeTenants: number;
  totalPlans: number;
  totalFoods: number;
}

export interface QPayConfig {
  terminalId: string;
  merchantId: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  planAmount: number;
  mccCode?: string;
}

export interface QPayInvoiceResponse {
  success: boolean;
  invoiceId: string;
  qrImage: string | null;
  qrText: string | null;
  urls: Array<{ name: string; description: string; logo: string; link: string }>;
  amount: number;
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("bolzoy_token");
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("bolzoy_token", token);
  }
}

export function clearAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("bolzoy_token");
    localStorage.removeItem("bolzoy_user");
  }
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("bolzoy_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User) {
  if (typeof window !== "undefined") {
    localStorage.setItem("bolzoy_user", JSON.stringify(user));
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || "Сүлжээний хүсэлт амжилтгүй боллоо");
  }

  return data;
}

export const api = {
  // Auth
  async loginTenant(username: string, password: string): Promise<{ token: string; user: User }> {
    const data = await request<{ token: string; user: User }>("/admin/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setAuthToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  async loginSuperAdmin(username: string, password: string): Promise<{ token: string; user: User }> {
    const data = await request<{ token: string; user: User }>("/superadmin/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setAuthToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>("/admin/api/me");
  },

  logout() {
    clearAuthToken();
  },

  // Tenant Admin APIs
  async getPlans(): Promise<DatePlan[]> {
    const res = await request<{ success: boolean; plans: DatePlan[] }>("/admin/api/plans");
    return res.plans;
  },

  async updatePlanStatus(id: string, status: PlanStatus, notes?: string): Promise<DatePlan> {
    const res = await request<{ success: boolean; plan: DatePlan }>(`/admin/api/plans/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, notes }),
    });
    return res.plan;
  },

  async deletePlan(id: string): Promise<boolean> {
    const res = await request<{ success: boolean }>(`/admin/api/plans/${id}`, {
      method: "DELETE",
    });
    return res.success;
  },

  async getFoods(): Promise<FoodItem[]> {
    const res = await request<{ success: boolean; foods: FoodItem[] }>("/admin/api/foods");
    return res.foods;
  },

  async addFood(emoji: string, name: string, type: "outdoor" | "home", price?: number, category?: string): Promise<FoodItem> {
    const res = await request<{ success: boolean; item: FoodItem }>("/admin/api/foods", {
      method: "POST",
      body: JSON.stringify({ emoji, name, type, price, category, isActive: true }),
    });
    return res.item;
  },

  async updateFood(id: string, updates: Partial<FoodItem>): Promise<FoodItem> {
    const res = await request<{ success: boolean; item: FoodItem }>(`/admin/api/foods/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    return res.item;
  },

  async deleteFood(id: string): Promise<boolean> {
    const res = await request<{ success: boolean }>(`/admin/api/foods/${id}`, {
      method: "DELETE",
    });
    return res.success;
  },

  async getAnalytics(): Promise<AnalyticsData> {
    return request<AnalyticsData>("/admin/api/analytics");
  },

  // SuperAdmin APIs
  async getTenants(): Promise<TenantUser[]> {
    const res = await request<{ success: boolean; tenants: TenantUser[] }>("/superadmin/api/tenants");
    return res.tenants;
  },

  async createTenant(username: string, slug: string, password: string, displayName?: string): Promise<TenantUser> {
    const res = await request<{ success: boolean; user: TenantUser }>("/superadmin/api/tenants", {
      method: "POST",
      body: JSON.stringify({ username, slug, password, displayName }),
    });
    return res.user;
  },

  async updateTenant(id: string, updates: { status?: "active" | "suspended"; password?: string }): Promise<TenantUser> {
    const res = await request<{ success: boolean; user: TenantUser }>(`/superadmin/api/tenants/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    return res.user;
  },

  async deleteTenant(id: string): Promise<boolean> {
    const res = await request<{ success: boolean }>(`/superadmin/api/tenants/${id}`, {
      method: "DELETE",
    });
    return res.success;
  },

  async getSuperAdminAnalytics(): Promise<SuperAdminAnalytics> {
    return request<SuperAdminAnalytics>("/superadmin/api/analytics");
  },

  async getQPayConfig(): Promise<QPayConfig> {
    const res = await request<{ success: boolean; config: QPayConfig }>("/superadmin/api/qpay-config");
    return res.config;
  },

  async updateQPayConfig(config: Partial<QPayConfig>): Promise<QPayConfig> {
    const res = await request<{ success: boolean; config: QPayConfig }>("/superadmin/api/qpay-config", {
      method: "POST",
      body: JSON.stringify(config),
    });
    return res.config;
  },

  async createQPayInvoice(username: string): Promise<QPayInvoiceResponse> {
    const res = await fetch(`${API_BASE}/api/qpay/create-invoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "QPay нэхэмжлэх үүсгэхэд алдаа гарлаа");
    }
    return data;
  },

  async checkQPayPayment(invoiceId: string, isDemoConfirm = false): Promise<{ paid: boolean }> {
    const res = await fetch(`${API_BASE}/api/qpay/check-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId, isDemoConfirm }),
    });
    return res.json();
  },

  async registerQPayMerchant(payload: {
    type?: "person" | "company";
    register_number: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    business_name: string;
    mcc_code?: string;
    address?: string;
    phone: string;
    email: string;
  }): Promise<{ success: boolean; merchantId: string }> {
    const res = await request<{ success: boolean; merchantId: string; error?: string }>("/superadmin/api/register-qpay-merchant", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res;
  },
};
