import React, { createContext, useState, useContext, useEffect } from "react";
import api from "../api";

// Create Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export function AuthProvider({ children }) {
        const [user, setUser] = useState(null);
        const [isAuthenticated, setIsAuthenticated] = useState(false);
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState(null);

        // Check if user is already logged in on mount
        useEffect(() => {
                const token = localStorage.getItem("access_token");
                if (token) {
                        // Verify token is still valid (optional: could decode JWT)
                        setIsAuthenticated(true);
                        const username = localStorage.getItem("username");
                        setUser({ username });
                }
                setIsLoading(false);
        }, []);

        // Register user
        const register = async (username, email, password) => {
                setIsLoading(true);
                setError(null);
                try {
                        const response = await api.request("/auth/register/", {
                                method: "POST",
                                body: JSON.stringify({
                                        username,
                                        email,
                                        password,
                                }),
                        });
                        setUser(response);
                        return response;
                } catch (err) {
                        setError(err.message);
                        throw err;
                } finally {
                        setIsLoading(false);
                }
        };

        // Login user
        const login = async (username, password) => {
                setIsLoading(true);
                setError(null);
                try {
                        const response = await api.request("/auth/token/", {
                                method: "POST",
                                body: JSON.stringify({ username, password }),
                        });
                        localStorage.setItem("access_token", response.access);
                        localStorage.setItem("refresh_token", response.refresh);
                        localStorage.setItem("username", username);
                        setUser({ username });
                        setIsAuthenticated(true);
                        return response;
                } catch (err) {
                        setError(err.message);
                        throw err;
                } finally {
                        setIsLoading(false);
                }
        };

        // Logout user
        const logout = () => {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                localStorage.removeItem("username");
                setUser(null);
                setIsAuthenticated(false);
                setError(null);
        };

        // Refresh token
        const refreshToken = async () => {
                try {
                        const refreshToken =
                                localStorage.getItem("refresh_token");
                        if (!refreshToken) {
                                throw new Error("No refresh token available");
                        }
                        const response = await api.request(
                                "/auth/token/refresh/",
                                {
                                        method: "POST",
                                        body: JSON.stringify({
                                                refresh: refreshToken,
                                        }),
                                },
                        );
                        localStorage.setItem("access_token", response.access);
                        return response;
                } catch (err) {
                        logout();
                        throw err;
                }
        };

        return (
                <AuthContext.Provider
                        value={{
                                user,
                                isAuthenticated,
                                isLoading,
                                error,
                                register,
                                login,
                                logout,
                                refreshToken,
                        }}
                >
                        {children}
                </AuthContext.Provider>
        );
}

// Custom hook to use auth context
export function useAuth() {
        const context = useContext(AuthContext);
        if (!context) {
                throw new Error("useAuth must be used within AuthProvider");
        }
        return context;
}
