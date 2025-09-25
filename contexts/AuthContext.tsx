"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import apiClient from "@/app/api/apiClient";

interface User {
  id: number;
  name: string;
  email: string;
  // añade más campos según tu backend
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth debe ser usado dentro de un AuthProvider");
	}
	return context;
};

interface AuthProviderProps {
  	children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		checkToken();
	}, []);

	const checkToken = async () => {
		try {
		const token = localStorage.getItem("authToken");

		if (token) {
			const response = await apiClient.get("/auth/verify");
			if (response.data.success) {
				setIsAuthenticated(true);
				setUser(response.data.user);
			} else {
				localStorage.removeItem("authToken");
				setIsAuthenticated(false);
				setUser(null);
			}
		}
		} catch (error) {
			console.error("Error verificando token:", error);
			localStorage.removeItem("authToken");
			setIsAuthenticated(false);
			setUser(null);
		} finally {
			setLoading(false);
		}
	};

	const login = async (token: string) => {
		try {
			localStorage.setItem("authToken", token);
			const response = await apiClient.get("/auth/verify");

			if (response.data.success) {
				setIsAuthenticated(true);
				setUser(response.data.user);
				return { success: true };
			} else {
				logout();
				return { success: false, error: "Token inválido" };
			}
		} catch (error) {
			console.error("Error en login:", error);
			logout();
			return { success: false, error: "Error de conexión" };
		}
	};

	const logout = () => {
		localStorage.removeItem("authToken");
		setIsAuthenticated(false);
		setUser(null);
	};

	const value: AuthContextType = {
		isAuthenticated,
		user,
		loading,
		login,
		logout,
		checkToken,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
