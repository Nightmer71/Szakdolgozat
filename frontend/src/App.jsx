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
import { LeagueListPage } from "./components/Leagues";
import api from "./api";
import "./styles/App.css";

function AppContent() {
        const { isAuthenticated, isLoading: authLoading } = useAuth();
        const { setPlayersData, setTeamsData, setIsLoading } = useData();
        const [currentPage, setCurrentPage] = useState("home");
        const [view, setView] = useState("login");

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

        return (
                <MainLayout
                        activeTab={currentPage}
                        onTabChange={setCurrentPage}
                >
                        {currentPage === "home" && <HomePage onTabChange={setCurrentPage} />}
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
