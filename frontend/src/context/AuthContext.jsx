import React, { createContext, useState, useContext, useEffect } from "react";
import api from "../api";

const decodeJWT = (token) => {
        try {
                const base64Url = token.split(".")[1];
                const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
                const jsonPayload = decodeURIComponent(
                        atob(base64)
                                .split("")
                                .map(function (c) {
                                        return (
                                                "%" +
                                                (
                                                        "00" +
                                                        c
                                                                .charCodeAt(0)
                                                                .toString(16)
                                                ).slice(-2)
                                        );
                                })
                                .join(""),
                );
                return JSON.parse(jsonPayload);
        } catch (error) {
                console.error("Error decoding JWT:", error);
                return null;
        }
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
        const [user, setUser] = useState(null);
        const [isAuthenticated, setIsAuthenticated] = useState(false);
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState(null);

        useEffect(() => {
                const token = sessionStorage.getItem("access_token");
                if (token) {
                        setIsAuthenticated(true);
                        const username = sessionStorage.getItem("username");
                        let userId = sessionStorage.getItem("user_id");
                        if (!userId) {
                                const decoded = decodeJWT(token);
                                if (decoded && decoded.user_id) {
                                        userId = decoded.user_id;
                                        sessionStorage.setItem(
                                                "user_id",
                                                userId,
                                        );
                                }
                        }
                        setUser({ username, id: userId });
                }
                setIsLoading(false);
        }, []);

        const register = async (username, email, password) => {
                setIsLoading(true);
                setError(null);
                try {
                        const response = await api.register(
                                username,
                                email,
                                password,
                        );
                        setUser(response);
                        return response;
                } catch (err) {
                        setError(err.message);
                        throw err;
                } finally {
                        setIsLoading(false);
                }
        };

        const login = async (username, password) => {
                setIsLoading(true);
                setError(null);
                try {
                        const response = await api.login(username, password);
                        sessionStorage.setItem("access_token", response.access);
                        sessionStorage.setItem(
                                "refresh_token",
                                response.refresh,
                        );
                        sessionStorage.setItem("username", username);

                        const decoded = decodeJWT(response.access);
                        if (decoded && decoded.user_id) {
                                sessionStorage.setItem(
                                        "user_id",
                                        decoded.user_id,
                                );
                                setUser({ username, id: decoded.user_id });
                        } else {
                                setUser({ username });
                        }

                        setIsAuthenticated(true);
                        return response;
                } catch (err) {
                        setError(err.message);
                        throw err;
                } finally {
                        setIsLoading(false);
                }
        };

        const logout = () => {
                sessionStorage.removeItem("access_token");
                sessionStorage.removeItem("refresh_token");
                sessionStorage.removeItem("username");
                setUser(null);
                setIsAuthenticated(false);
                setError(null);
        };

        const refreshToken = async () => {
                try {
                        const refreshToken =
                                sessionStorage.getItem("refresh_token");
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
                        sessionStorage.setItem("access_token", response.access);
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

export function useAuth() {
        const context = useContext(AuthContext);
        if (!context) {
                throw new Error("useAuth must be used within AuthProvider");
        }
        return context;
}
