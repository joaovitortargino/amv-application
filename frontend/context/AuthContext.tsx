"use client";
import { AuthResponse, LoginCredentials, RegisterData, User } from "@/types";
import { apiService } from "../services/api";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthContexType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContexType | undefined>(undefined);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = apiService.getToken();
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const userData = await apiService.get<User>("settings/user");
      setUser(userData);
    } catch (error) {
      apiService.clearTokens();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    const response = await apiService.post<AuthResponse>(
      "auth/login",
      credentials,
    );
    apiService.setTokens(response.token, response.refreshToken);
    setUser(response.user);
  };

  const register = async (data: RegisterData) => {
    const response = await apiService.post<AuthResponse>("auth/register", data);
    apiService.setTokens(response.token, response.refreshToken);
    setUser(response.user);
  };

  const logout = () => {
    apiService.clearTokens();
    window.location.href = "/login";
    setUser(null);
  };

  const isAuthenticated = () => {
    if (loading) return false;
    return !!apiService.getToken();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within a AuthProvider");
  }

  return context;
}
