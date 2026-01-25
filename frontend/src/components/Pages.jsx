import React, { useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import api from "../api";
import "../styles/Pages.css";

export function HomePage() {
        const { teams, matches } = useData();
        const [stats, setStats] = useState({ totalTeams: 0, totalMatches: 0 });

        useEffect(() => {
                setStats({
                        totalTeams: teams.length,
                        totalMatches: matches.length,
                });
        }, [teams, matches]);

        return (
                <div className="page-container">
                        <h2>Dashboard</h2>

                        <div className="stats-grid">
                                <div className="stat-card">
                                        <div className="stat-icon">👔</div>
                                        <h3>My Teams</h3>
                                        <p className="stat-value">
                                                {stats.totalTeams}
                                        </p>
                                        <a href="#teams" className="stat-link">
                                                View Teams
                                        </a>
                                </div>

                                <div className="stat-card">
                                        <div className="stat-icon">🎮</div>
                                        <h3>Matches</h3>
                                        <p className="stat-value">
                                                {stats.totalMatches}
                                        </p>
                                        <a
                                                href="#matches"
                                                className="stat-link"
                                        >
                                                View Matches
                                        </a>
                                </div>

                                <div className="stat-card">
                                        <div className="stat-icon">👥</div>
                                        <h3>Available Players</h3>
                                        <p className="stat-value">-</p>
                                        <a
                                                href="#players"
                                                className="stat-link"
                                        >
                                                Browse Players
                                        </a>
                                </div>
                        </div>

                        <div className="welcome-section">
                                <h3>Welcome to Fantasy Basketball!</h3>
                                <p>
                                        Build your dream team by selecting real
                                        NBA players and compete against other
                                        users. Simulate matches, track
                                        statistics, and climb the leaderboard.
                                </p>
                                <div className="welcome-actions">
                                        <button className="btn btn-primary">
                                                Create New Team
                                        </button>
                                        <button className="btn btn-secondary">
                                                Browse Players
                                        </button>
                                </div>
                        </div>
                </div>
        );
}

export function PlayersPage() {
        const [players, setPlayers] = useState([]);
        const [filteredPlayers, setFilteredPlayers] = useState([]);
        const [isLoading, setIsLoading] = useState(false);
        const [search, setSearch] = useState("");
        const [positionFilter, setPositionFilter] = useState("");

        useEffect(() => {
                loadPlayers();
        }, []);

        const loadPlayers = async () => {
                setIsLoading(true);
                try {
                        const response = await api.getPlayers(1, "");
                        setPlayers(response.results || response);
                        setFilteredPlayers(response.results || response);
                } catch (error) {
                        console.error("Failed to load players:", error);
                } finally {
                        setIsLoading(false);
                }
        };

        const handleSearch = (value) => {
                setSearch(value);
                filterPlayers(value, positionFilter);
        };

        const handlePositionFilter = (value) => {
                setPositionFilter(value);
                filterPlayers(search, value);
        };

        const filterPlayers = (searchTerm, position) => {
                let filtered = players;

                if (searchTerm) {
                        filtered = filtered.filter((p) =>
                                p.name
                                        .toLowerCase()
                                        .includes(searchTerm.toLowerCase()),
                        );
                }

                if (position) {
                        filtered = filtered.filter(
                                (p) => p.position === position,
                        );
                }

                setFilteredPlayers(filtered);
        };

        return (
                <div className="page-container">
                        <h2>Players</h2>

                        <div className="filter-section">
                                <input
                                        type="text"
                                        placeholder="Search by player name..."
                                        value={search}
                                        onChange={(e) =>
                                                handleSearch(e.target.value)
                                        }
                                        className="filter-input"
                                />
                                <select
                                        value={positionFilter}
                                        onChange={(e) =>
                                                handlePositionFilter(
                                                        e.target.value,
                                                )
                                        }
                                        className="filter-select"
                                >
                                        <option value="">All Positions</option>
                                        <option value="PG">
                                                Point Guard (PG)
                                        </option>
                                        <option value="SG">
                                                Shooting Guard (SG)
                                        </option>
                                        <option value="SF">
                                                Small Forward (SF)
                                        </option>
                                        <option value="PF">
                                                Power Forward (PF)
                                        </option>
                                        <option value="C">Center (C)</option>
                                </select>
                        </div>

                        {isLoading ? (
                                <p className="loading">Loading players...</p>
                        ) : filteredPlayers.length === 0 ? (
                                <p className="no-results">No players found</p>
                        ) : (
                                <div className="players-grid">
                                        {filteredPlayers.map((player) => (
                                                <div
                                                        key={player.id}
                                                        className="player-card"
                                                >
                                                        <h3>{player.name}</h3>
                                                        <div className="player-info">
                                                                <p>
                                                                        <strong>
                                                                                Position:
                                                                        </strong>{" "}
                                                                        {player.position ||
                                                                                "N/A"}
                                                                </p>
                                                                <p>
                                                                        <strong>
                                                                                Team:
                                                                        </strong>{" "}
                                                                        {player.team ||
                                                                                "N/A"}
                                                                </p>
                                                        </div>
                                                        <button className="btn btn-small">
                                                                Add to Team
                                                        </button>
                                                </div>
                                        ))}
                                </div>
                        )}
                </div>
        );
}

export function TeamsPage() {
        const { teams, addTeam, setSelectedTeam } = useData();
        const [showCreateForm, setShowCreateForm] = useState(false);
        const [newTeamName, setNewTeamName] = useState("");
        const [isLoading, setIsLoading] = useState(false);

        const handleCreateTeam = async () => {
                if (!newTeamName.trim()) return;

                setIsLoading(true);
                try {
                        const response = await api.createTeam(newTeamName);
                        addTeam(response);
                        setNewTeamName("");
                        setShowCreateForm(false);
                } catch (error) {
                        console.error("Failed to create team:", error);
                } finally {
                        setIsLoading(false);
                }
        };

        return (
                <div className="page-container">
                        <h2>My Teams</h2>

                        {!showCreateForm && (
                                <button
                                        className="btn btn-primary"
                                        onClick={() => setShowCreateForm(true)}
                                >
                                        + Create New Team
                                </button>
                        )}

                        {showCreateForm && (
                                <div className="create-form">
                                        <input
                                                type="text"
                                                placeholder="Team name..."
                                                value={newTeamName}
                                                onChange={(e) =>
                                                        setNewTeamName(
                                                                e.target.value,
                                                        )
                                                }
                                                className="form-input"
                                        />
                                        <button
                                                className="btn btn-primary"
                                                onClick={handleCreateTeam}
                                                disabled={isLoading}
                                        >
                                                {isLoading
                                                        ? "Creating..."
                                                        : "Create Team"}
                                        </button>
                                        <button
                                                className="btn btn-secondary"
                                                onClick={() =>
                                                        setShowCreateForm(false)
                                                }
                                        >
                                                Cancel
                                        </button>
                                </div>
                        )}

                        {teams.length === 0 ? (
                                <p className="no-results">
                                        You haven't created any teams yet.
                                        Create one to get started!
                                </p>
                        ) : (
                                <div className="teams-grid">
                                        {teams.map((team) => (
                                                <div
                                                        key={team.id}
                                                        className="team-card"
                                                >
                                                        <h3>{team.name}</h3>
                                                        <p className="team-info">
                                                                {team.roster
                                                                        ?.length ||
                                                                        0}{" "}
                                                                players
                                                        </p>
                                                        <div className="team-actions">
                                                                <button
                                                                        className="btn btn-small"
                                                                        onClick={() =>
                                                                                setSelectedTeam(
                                                                                        team,
                                                                                )
                                                                        }
                                                                >
                                                                        View
                                                                </button>
                                                                <button className="btn btn-small">
                                                                        Edit
                                                                </button>
                                                        </div>
                                                </div>
                                        ))}
                                </div>
                        )}
                </div>
        );
}

export function MatchesPage() {
        const { matches } = useData();

        return (
                <div className="page-container">
                        <h2>Matches</h2>

                        <button className="btn btn-primary">
                                + Simulate New Match
                        </button>

                        {matches.length === 0 ? (
                                <p className="no-results">
                                        No matches yet. Create a match
                                        simulation to get started!
                                </p>
                        ) : (
                                <div className="matches-list">
                                        {matches.map((match) => (
                                                <div
                                                        key={match.id}
                                                        className="match-card"
                                                >
                                                        <h3>
                                                                {match.team_a
                                                                        ?.name ||
                                                                        "Team A"}{" "}
                                                                vs{" "}
                                                                {match.team_b
                                                                        ?.name ||
                                                                        "Team B"}
                                                        </h3>
                                                        <div className="match-result">
                                                                <span className="score">
                                                                        {match
                                                                                .result
                                                                                ?.team_a_score ||
                                                                                0}
                                                                </span>
                                                                <span className="vs">
                                                                        VS
                                                                </span>
                                                                <span className="score">
                                                                        {match
                                                                                .result
                                                                                ?.team_b_score ||
                                                                                0}
                                                                </span>
                                                        </div>
                                                        <p className="match-date">
                                                                {new Date(
                                                                        match.created_at,
                                                                ).toLocaleDateString()}
                                                        </p>
                                                        <button className="btn btn-small">
                                                                View Details
                                                        </button>
                                                </div>
                                        ))}
                                </div>
                        )}
                </div>
        );
}
