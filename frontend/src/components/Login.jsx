import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/Auth.css";

export function Login({ onLoginSuccess }) {
        const [username, setUsername] = useState("");
        const [password, setPassword] = useState("");
        const [error, setError] = useState("");
        const [isLoading, setIsLoading] = useState(false);
        const { login } = useAuth();

        const handleSubmit = async (e) => {
                e.preventDefault();
                setError("");
                setIsLoading(true);

                try {
                        await login(username, password);
                        onLoginSuccess?.();
                } catch (err) {
                        setError(
                                err.message ||
                                        "Login failed. Please check your credentials.",
                        );
                } finally {
                        setIsLoading(false);
                }
        };

        return (
                <div className="auth-container">
                        <div className="auth-card">
                                <h1>Fantasy Basketball</h1>
                                <h2>Login</h2>

                                {error && (
                                        <div className="error-message">
                                                {error}
                                        </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                        <div className="form-group">
                                                <label htmlFor="username">
                                                        Username
                                                </label>
                                                <input
                                                        id="username"
                                                        type="text"
                                                        value={username}
                                                        onChange={(e) =>
                                                                setUsername(
                                                                        e.target
                                                                                .value,
                                                                )
                                                        }
                                                        placeholder="Enter your username"
                                                        required
                                                        disabled={isLoading}
                                                />
                                        </div>

                                        <div className="form-group">
                                                <label htmlFor="password">
                                                        Password
                                                </label>
                                                <input
                                                        id="password"
                                                        type="password"
                                                        value={password}
                                                        onChange={(e) =>
                                                                setPassword(
                                                                        e.target
                                                                                .value,
                                                                )
                                                        }
                                                        placeholder="Enter your password"
                                                        required
                                                        disabled={isLoading}
                                                />
                                        </div>

                                        <button
                                                type="submit"
                                                className="btn btn-primary"
                                                disabled={isLoading}
                                        >
                                                {isLoading
                                                        ? "Logging in..."
                                                        : "Login"}
                                        </button>
                                </form>

                                <p className="auth-footer">
                                        Don't have an account?{" "}
                                        <a href="#register">Register here</a>
                                </p>
                        </div>
                </div>
        );
}
