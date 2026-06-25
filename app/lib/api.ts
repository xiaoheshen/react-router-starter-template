// API 客户端模块
// 提供统一的 HTTP 请求封装，包含数据缓存、分页加载、错误处理及重试机制

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  status: number;
  message: string;
  details?: string;
}

// 内存缓存（浏览器端，非 SSR）
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

/**
 * 生成缓存键
 */
function cacheKey(url: string, options?: RequestInit): string {
  return `${options?.method || "GET"}:${url}:${options?.body || ""}`;
}

/**
 * 从缓存读取
 */
function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

/**
 * 写入缓存
 */
function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * 清除所有缓存
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * 清除指定前缀的缓存
 */
export function clearCacheByPrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.includes(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * 通用 API 请求函数，支持重试
 */
async function request<T>(
  url: string,
  options: RequestInit = {},
  retries = 2,
  useCache = true
): Promise<ApiResponse<T>> {
  const key = cacheKey(url, options);
  
  // GET 请求优先读缓存
  if (useCache && (!options.method || options.method === "GET")) {
    const cached = getFromCache<ApiResponse<T>>(key);
    if (cached) return cached;
  }
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });
      
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          message: (errorBody as any).error || `请求失败 (${response.status})`,
          details: (errorBody as any).details,
        } as ApiError;
      }
      
      const data = await response.json();
      const result: ApiResponse<T> = { success: true, data };
      
      // 缓存成功的 GET 请求
      if (!options.method || options.method === "GET") {
        setCache(key, result);
      }
      
      return result;
    } catch (err: any) {
      lastError = err;
      if (attempt < retries && err.status && err.status >= 500) {
        // 服务器错误才重试，等待指数增长
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500));
        continue;
      }
      break;
    }
  }
  
  return {
    success: false,
    error: lastError?.message || "网络请求失败，请检查网络连接",
  };
}

// ==================== 内容 API ====================

export async function fetchContent() {
  return request<import("../data/content").SiteContent>("/api/content");
}

export async function updateContent(content: import("../data/content").SiteContent) {
  return request("/api/content", {
    method: "PUT",
    body: JSON.stringify(content),
  });
}

// ==================== 咨询 API ====================

export async function fetchInquiries(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
  if (params?.search) searchParams.set("search", params.search);
  if (params?.status) searchParams.set("status", params.status);
  
  const query = searchParams.toString();
  return request<PaginatedResponse<import("../data/store").Inquiry>>(
    `/api/inquiries${query ? `?${query}` : ""}`
  );
}

export async function deleteInquiry(id: string) {
  return request(`/api/inquiries`, {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
}

export async function updateInquiryStatus(id: string, status: string) {
  return request(`/api/inquiries`, {
    method: "PATCH",
    body: JSON.stringify({ id, status }),
  });
}

export async function batchDeleteInquiries(ids: string[]) {
  return request(`/api/inquiries/batch`, {
    method: "POST",
    body: JSON.stringify({ action: "delete", ids }),
  });
}

// ==================== 图片上传 API ====================

export async function uploadImage(
  file: File,
  options?: { maxWidth?: number; maxHeight?: number }
): Promise<ApiResponse<{ url: string; thumbnailUrl?: string }>> {
  const formData = new FormData();
  formData.append("image", file);
  if (options?.maxWidth) formData.append("maxWidth", String(options.maxWidth));
  if (options?.maxHeight) formData.append("maxHeight", String(options.maxHeight));
  
  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      return {
        success: false,
        error: (errorBody as any).error || `上传失败 (${response.status})`,
      };
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "图片上传失败，请检查网络连接",
    };
  }
}

// ==================== 登录 API ====================

export async function login(password: string) {
  return request<{ token: string }>("/api/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}