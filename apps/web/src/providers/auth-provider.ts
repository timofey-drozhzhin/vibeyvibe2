import type { AuthProvider } from "@refinedev/core";
import { API_URL } from "../config/constants.js";

const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    const response = await fetch(`${API_URL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      return { success: true, redirectTo: "/" };
    }

    const data = await response.json().catch(() => ({}));

    return {
      success: false,
      error: {
        name: "LoginError",
        message: data?.message || "Invalid email or password",
      },
    };
  },

  logout: async () => {
    await fetch(`${API_URL}/api/auth/sign-out`, {
      method: "POST",
      credentials: "include",
    });

    return { success: true, redirectTo: "/login" };
  },

  check: async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/get-session`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.session) {
          return { authenticated: true };
        }
      }

      return {
        authenticated: false,
        redirectTo: "/login",
      };
    } catch {
      return {
        authenticated: false,
        redirectTo: "/login",
      };
    }
  },

  getIdentity: async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/get-session`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.session?.user) {
          const user = data.session.user;
          return {
            id: user.id,
            name: user.name || user.email,
            email: user.email,
            avatar: user.image,
            role: user.role || "editor",
          };
        }
      }

      return null;
    } catch {
      return null;
    }
  },

  onError: async (error) => {
    if (error?.statusCode === 401) {
      return { logout: true, redirectTo: "/login" };
    }
    return { error };
  },
};

export default authProvider;
