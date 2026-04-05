import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider, useData } from "./context/DataContext";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { MainLayout } from "./components/Layout";
import {
        HomePage,
        PlayersPage,
        TeamsPage,
        MatchesPage,
} from "./components/Pages";
import { LeagueListPage, LeagueDetailPage } from "./components/Leagues";
import { DraftPage } from "./components/DraftPage";
import api from "./api";
import "./styles/App.css";

function AppContent() {
        const { isAuthenticated, isLoading: authLoading } = useAuth();
        const { setPlayersData, setTeamsData, setIsLoading } = useData();
        const [currentPage, setCurrentPage] = useState("home");
        const [view, setView] = useState("login"); // 'login', 'register', 'app'

        // Check URL for specific pages
        const urlPath = window.location.pathname;
        const leagueMatch = urlPath.match(/^\/league\/(\d+)$/);
        const draftMatch = urlPath.match(/^\/draft\/(\d+)$/);

        useEffect(() => {
                if (isAuthenticated) {
                        setView("app");
                        loadPlayers();
                        loadTeams();
                } else if (!authLoading) {
                        setView("login");
                }
        }, [isAuthenticated, authLoading]);

        const loadPlayers = async () => {
                setIsLoading(true);
                try {
                        const response = await api.getPlayers(1, "");
                        setPlayersData(response.results || response);
                } catch (error) {
                        console.error("Failed to load players:", error);
                } finally {
                        setIsLoading(false);
                }
        };

        const loadTeams = async () => {
                try {
                        const response = await api.getTeams();
                        setTeamsData(response.results || response);
                } catch (error) {
                        console.error("Failed to load teams:", error);
                }
        };

        if (authLoading) {
                return <div className="loading-screen">Loading...</div>;
        }

        if (view === "login") {
                return (
                        <div className="auth-wrapper">
                                <Login
                                        onLoginSuccess={() => {
                                                setView("app");
                                                setCurrentPage("home");
                                        }}
                                />
                                <div className="auth-switch">
                                        Don't have an account?{" "}
                                        <button
                                                onClick={() =>
                                                        setView("register")
                                                }
                                                className="link-button"
                                        >
                                                Register here
                                        </button>
                                </div>
                        </div>
                );
        }

        if (view === "register") {
                return (
                        <div className="auth-wrapper">
                                <Register
                                        onRegisterSuccess={() => {
                                                setView("app");
                                                setCurrentPage("home");
                                        }}
                                />
                                <div className="auth-switch">
                                        Already have an account?{" "}
                                        <button
                                                onClick={() => setView("login")}
                                                className="link-button"
                                        >
                                                Login here
                                        </button>
                                </div>
                        </div>
                );
        }

        // Main app view
        if (leagueMatch) {
                const handleTabChange = (tab) => {
                        // Navigate back to main app when changing tabs from league view
                        window.history.pushState(null, "", "/");
                        setCurrentPage(tab);
                };
                return (
                        <MainLayout
                                activeTab="leagues"
                                onTabChange={handleTabChange}
                        >
                                <LeagueDetailPage
                                        leagueId={parseInt(leagueMatch[1])}
                                />
                        </MainLayout>
                );
        }

        if (draftMatch) {
                const handleTabChange = (tab) => {
                        // Navigate back to main app when changing tabs from draft view
                        window.history.pushState(null, "", "/");
                        setCurrentPage(tab);
                };
                return (
                        <MainLayout
                                activeTab="leagues"
                                onTabChange={handleTabChange}
                        >
                                <DraftPage leagueId={parseInt(draftMatch[1])} />
                        </MainLayout>
                );
        }

        return (
                <MainLayout
                        activeTab={currentPage}
                        onTabChange={setCurrentPage}
                >
                        {currentPage === "home" && <HomePage />}
                        {currentPage === "players" && <PlayersPage />}
                        {currentPage === "teams" && <TeamsPage />}
                        {currentPage === "matches" && <MatchesPage />}
                        {currentPage === "leagues" && <LeagueListPage />}
                </MainLayout>
        );
}

function App() {
        return (
                <AuthProvider>
                        <DataProvider>
                                <AppContent />
                        </DataProvider>
                </AuthProvider>
        );
}

export default App;
