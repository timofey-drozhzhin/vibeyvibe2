import type { DataProvider } from "@refinedev/core";

const API_URL = import.meta.env.VITE_API_URL || "";
const BASE = `${API_URL}/api`;

async function request(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

const dataProvider: DataProvider = {
  getApiUrl: () => BASE,

  getList: async ({ resource, pagination, sorters, filters }) => {
    const { currentPage = 1, pageSize = 25, mode = "server" } = pagination ?? {};

    const params = new URLSearchParams();

    if (mode === "server") {
      params.set("page", String(currentPage));
      params.set("pageSize", String(pageSize));
    }

    if (sorters && sorters.length > 0) {
      params.set("sort", sorters[0].field);
      params.set("order", sorters[0].order);
    }

    // Map Refine filters to our API query params
    if (filters) {
      for (const filter of filters) {
        if ("field" in filter && filter.field === "search" && filter.value) {
          params.set("search", String(filter.value));
          params.set("q", String(filter.value));
        }
        if ("field" in filter && filter.field === "archived" && filter.value !== undefined) {
          params.set("archived", String(filter.value));
        }
        if ("field" in filter && filter.field === "sourceId" && filter.value) {
          params.set("sourceId", String(filter.value));
        }
        if ("field" in filter && filter.field === "voiceGender" && filter.value) {
          params.set("voiceGender", String(filter.value));
        }
        if ("field" in filter && filter.field === "category" && filter.value) {
          params.set("category", String(filter.value));
        }
      }
    }

    const url = `${BASE}/${resource}?${params.toString()}`;
    const raw = await request(url);

    const items = Array.isArray(raw) ? raw : (raw.data || []);
    const total = raw.total ?? raw.pagination?.total ?? items.length;

    return { data: items, total };
  },

  getOne: async ({ resource, id }) => {
    const url = `${BASE}/${resource}/${id}`;
    const raw = await request(url);
    const data = raw && typeof raw === 'object' && 'data' in raw && !Array.isArray(raw.data) ? raw.data : raw;
    return { data };
  },

  create: async ({ resource, variables }) => {
    const url = `${BASE}/${resource}`;
    const data = await request(url, {
      method: "POST",
      body: JSON.stringify(variables),
    });
    return { data };
  },

  update: async ({ resource, id, variables }) => {
    const url = `${BASE}/${resource}/${id}`;
    const data = await request(url, {
      method: "PUT",
      body: JSON.stringify(variables),
    });
    return { data };
  },

  deleteOne: async ({ resource, id }) => {
    // No delete - archive instead
    const url = `${BASE}/${resource}/${id}`;
    const data = await request(url, {
      method: "PUT",
      body: JSON.stringify({ archived: true }),
    });
    return { data };
  },

  custom: async ({ url, method, payload, query }) => {
    const params = query ? new URLSearchParams(query as Record<string, string>) : null;
    const fullUrl = params ? `${url}?${params.toString()}` : url;
    const data = await request(fullUrl, {
      method: (method as string)?.toUpperCase() || "GET",
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
    return { data };
  },
};

export default dataProvider;
