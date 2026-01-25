import React from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/Layout.css";

export function Header() {
        const { user, logout, isAuthenticated } = useAuth();

        return (
                <header className="header">
                        <div className="header-container">
                                <div className="header-brand">
                                        <h1>🏀 Fantasy Basketball</h1>
                                </div>
                                <nav className="header-nav">
                                        {isAuthenticated ? (
                                                <>
                                                        <span className="user-greeting">
                                                                Welcome,{" "}
                                                                {user?.username}
                                                                !
                                                        </span>
                                                        <button
                                                                onClick={logout}
                                                                className="btn btn-secondary btn-small"
                                                        >
                                                                Logout
                                                        </button>
                                                </>
                                        ) : (
                                                <>
                                                        <a
                                                                href="#login"
                                                                className="nav-link"
                                                        >
                                                                Login
                                                        </a>
                                                        <a
                                                                href="#register"
                                                                className="nav-link"
                                                        >
                                                                Register
                                                        </a>
                                                </>
                                        )}
                                </nav>
                        </div>
                </header>
        );
}

export function Sidebar({ activeTab, onTabChange }) {
        const { isAuthenticated } = useAuth();

        if (!isAuthenticated) return null;

        return (
                <aside className="sidebar">
                        <nav className="sidebar-nav">
                                <ul>
                                        <li>
                                                <button
                                                        className={`nav-item ${activeTab === "home" ? "active" : ""}`}
                                                        onClick={() =>
                                                                onTabChange(
                                                                        "home",
                                                                )
                                                        }
                                                >
                                                        🏠 Home
                                                </button>
                                        </li>
                                        <li>
                                                <button
                                                        className={`nav-item ${activeTab === "players" ? "active" : ""}`}
                                                        onClick={() =>
                                                                onTabChange(
                                                                        "players",
                                                                )
                                                        }
                                                >
                                                        👥 Players
                                                </button>
                                        </li>
                                        <li>
                                                <button
                                                        className={`nav-item ${activeTab === "teams" ? "active" : ""}`}
                                                        onClick={() =>
                                                                onTabChange(
                                                                        "teams",
                                                                )
                                                        }
                                                >
                                                        👔 My Teams
                                                </button>
                                        </li>
                                        <li>
                                                <button
                                                        className={`nav-item ${activeTab === "matches" ? "active" : ""}`}
                                                        onClick={() =>
                                                                onTabChange(
                                                                        "matches",
                                                                )
                                                        }
                                                >
                                                        🎮 Matches
                                                </button>
                                        </li>
                                </ul>
                        </nav>
                </aside>
        );
}

export function MainLayout({ activeTab, onTabChange, children }) {
        return (
                <div className="layout">
                        <Header />
                        <div className="layout-container">
                                <Sidebar
                                        activeTab={activeTab}
                                        onTabChange={onTabChange}
                                />
                                <main className="main-content">{children}</main>
                        </div>
                </div>
        );
}
