import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/Auth.css";

export function Register({ onRegisterSuccess }) {
        const [username, setUsername] = useState("");
        const [email, setEmail] = useState("");
        const [password, setPassword] = useState("");
        const [confirmPassword, setConfirmPassword] = useState("");
        const [error, setError] = useState("");
        const [isLoading, setIsLoading] = useState(false);
        const { register, login } = useAuth();

        const handleSubmit = async (e) => {
                e.preventDefault();
                setError("");

                if (password !== confirmPassword) {
                        setError("Passwords do not match.");
                        return;
                }

                setIsLoading(true);

                try {
                        await register(username, email, password);
                        // Auto-login after registration
                        await login(username, password);
                        onRegisterSuccess?.();
                } catch (err) {
                        setError(
                                err.message ||
                                        "Registration failed. Please try again.",
                        );
                } finally {
                        setIsLoading(false);
                }
        };

        return (
                <div className="auth-container">
                        <div className="auth-card">
                                <h1>Fantasy Basketball</h1>
                                <h2>Register</h2>

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
                                                        placeholder="Choose a username"
                                                        required
                                                        disabled={isLoading}
                                                />
                                        </div>

                                        <div className="form-group">
                                                <label htmlFor="email">
                                                        Email
                                                </label>
                                                <input
                                                        id="email"
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) =>
                                                                setEmail(
                                                                        e.target
                                                                                .value,
                                                                )
                                                        }
                                                        placeholder="Enter your email"
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
                                                        placeholder="Create a password"
                                                        required
                                                        disabled={isLoading}
                                                />
                                        </div>

                                        <div className="form-group">
                                                <label htmlFor="confirmPassword">
                                                        Confirm Password
                                                </label>
                                                <input
                                                        id="confirmPassword"
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={(e) =>
                                                                setConfirmPassword(
                                                                        e.target
                                                                                .value,
                                                                )
                                                        }
                                                        placeholder="Confirm your password"
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
                                                        ? "Registering..."
                                                        : "Register"}
                                        </button>
                                </form>

                                <p className="auth-footer">
                                        Already have an account?{" "}
                                        <a href="#login">Login here</a>
                                </p>
                        </div>
                </div>
        );
}
