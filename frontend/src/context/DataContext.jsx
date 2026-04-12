import React, { createContext, useState, useContext } from "react";

const DataContext = createContext(null);

export function DataProvider({ children }) {
        const [teams, setTeams] = useState([]);
        const [players, setPlayers] = useState([]);
        const [matches, setMatches] = useState([]);
        const [selectedTeam, setSelectedTeam] = useState(null);
        const [isLoading, setIsLoading] = useState(false);
        const [error, setError] = useState(null);

        const addTeam = (team) => {
                setTeams([...teams, team]);
        };

        const updateTeam = (id, updatedTeam) => {
                setTeams(teams.map((t) => (t.id === id ? updatedTeam : t)));
                if (selectedTeam?.id === id) {
                        setSelectedTeam(updatedTeam);
                }
        };

        const removeTeam = (id) => {
                setTeams(teams.filter((t) => t.id !== id));
                if (selectedTeam?.id === id) {
                        setSelectedTeam(null);
                }
        };

        const setPlayersData = (playerList) => {
                setPlayers(playerList);
        };

        const setTeamsData = (teamList) => {
                setTeams(teamList);
        };

        const addMatch = (match) => {
                setMatches([...matches, match]);
        };

        const updateMatch = (id, updatedMatch) => {
                setMatches(
                        matches.map((m) => (m.id === id ? updatedMatch : m)),
                );
        };

        return (
                <DataContext.Provider
                        value={{
                                teams,
                                players,
                                matches,
                                selectedTeam,
                                isLoading,
                                error,
                                addTeam,
                                updateTeam,
                                removeTeam,
                                setPlayersData,
                                setTeamsData,
                                addMatch,
                                updateMatch,
                                setSelectedTeam,
                                setIsLoading,
                                setError,
                        }}
                >
                        {children}
                </DataContext.Provider>
        );
}

export function useData() {
        const context = useContext(DataContext);
        if (!context) {
                throw new Error("useData must be used within DataProvider");
        }
        return context;
}
