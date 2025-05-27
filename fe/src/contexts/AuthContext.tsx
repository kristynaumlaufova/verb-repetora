import React, { createContext, useContext, useState, useEffect } from "react";
import { authService, UserDto } from "../services/authService";

interface AuthContextType {
  user: UserDto | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    password: string,
    language: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(authService.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);

  useEffect(() => {
    const handleAuthChange = () => {
      const currentUser = authService.getUser();
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
    };

    window.addEventListener("auth-change", handleAuthChange);
    return () => window.removeEventListener("auth-change", handleAuthChange);
  }, []);

  const login = async (username: string, password: string) => {
    const response = await authService.login({ username, password });
    setUser(response.user);
    setIsAuthenticated(true);
  };

  const register = async (
    username: string,
    password: string,
    language: string
  ) => {
    const response = await authService.register({
      username,
      password,
      language,
    });
    setUser(response.user);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
