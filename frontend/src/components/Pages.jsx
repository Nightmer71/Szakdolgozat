import React, { useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import api from "../api";
import TeamBuilder from "./TeamBuilder";
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
        const { selectedTeam } = useData();
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
                                                        <button
                                                                className="btn btn-small"
                                                                onClick={async () => {
                                                                        if (
                                                                                !selectedTeam
                                                                        ) {
                                                                                alert(
                                                                                        "Select a team first (click a team and press View) or use the Teams page Edit button",
                                                                                );
                                                                                return;
                                                                        }

                                                                        try {
                                                                                await api.addPlayerToTeam(
                                                                                        selectedTeam.id,
                                                                                        player.id,
                                                                                );
                                                                                alert(
                                                                                        "Player added to team",
                                                                                );
                                                                        } catch (err) {
                                                                                console.error(
                                                                                        "Add to team failed",
                                                                                        err,
                                                                                );
                                                                                alert(
                                                                                        "Failed to add player to team",
                                                                                );
                                                                        }
                                                                }}
                                                        >
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
        const { teams, addTeam, setSelectedTeam, updateTeam } = useData();
        const [showCreateForm, setShowCreateForm] = useState(false);
        const [newTeamName, setNewTeamName] = useState("");
        const [isLoading, setIsLoading] = useState(false);
        const [editingTeam, setEditingTeam] = useState(null);

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

        const handleCloseBuilder = () => setEditingTeam(null);
        const handleTeamUpdated = (updated) => {
                updateTeam(updated.id, updated);
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

                        {editingTeam && (
                                <div className="builder-modal">
                                        <TeamBuilder
                                                team={editingTeam}
                                                onClose={handleCloseBuilder}
                                                onUpdated={handleTeamUpdated}
                                        />
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
                                                                <button
                                                                        className="btn btn-small"
                                                                        onClick={() =>
                                                                                setEditingTeam(
                                                                                        team,
                                                                                )
                                                                        }
                                                                >
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
        const { matches, teams, addMatch } = useData();
        const [showSimulate, setShowSimulate] = useState(false);
        const [teamA, setTeamA] = useState(null);
        const [teamB, setTeamB] = useState(null);
        const [isSimulating, setIsSimulating] = useState(false);
        const [replayMatch, setReplayMatch] = useState(null);
        const [replayIndex, setReplayIndex] = useState(0);
        const [displayTimeline, setDisplayTimeline] = useState([]);
        const [scoreA, setScoreA] = useState(0);
        const [scoreB, setScoreB] = useState(0);

        useEffect(() => {
                let timer;
                if (replayMatch && replayMatch.result?.timeline) {
                        const timeline = replayMatch.result.timeline;
                        if (replayIndex < timeline.length) {
                                timer = setTimeout(() => {
                                        const ev = timeline[replayIndex];
                                        setDisplayTimeline((t) => [...t, ev]);
                                        if (
                                                ev.team_id ===
                                                replayMatch.team_a.id
                                        ) {
                                                setScoreA((s) => s + ev.points);
                                        } else {
                                                setScoreB((s) => s + ev.points);
                                        }
                                        setReplayIndex((i) => i + 1);
                                }, 150);
                        }
                }
                return () => clearTimeout(timer);
        }, [replayMatch, replayIndex]);

        const startReplay = (match) => {
                setReplayMatch(match);
                setReplayIndex(0);
                setDisplayTimeline([]);
                setScoreA(0);
                setScoreB(0);
        };

        const handleSimulate = async () => {
                if (!teamA || !teamB)
                        return alert("Select both teams to simulate");
                if (teamA.id === teamB.id)
                        return alert("Choose two different teams");

                try {
                        setIsSimulating(true);
                        const created = await api.simulateMatch(
                                teamA.id,
                                teamB.id,
                        );
                        addMatch(created);
                        setShowSimulate(false);
                        startReplay(created);
                } catch (err) {
                        console.error("Simulation failed", err);
                        alert("Simulation failed");
                } finally {
                        setIsSimulating(false);
                }
        };

        return (
                <div className="page-container">
                        <h2>Matches</h2>

                        <button
                                className="btn btn-primary"
                                onClick={() => setShowSimulate(true)}
                        >
                                + Simulate New Match
                        </button>

                        {showSimulate && (
                                <div className="builder-modal">
                                        <div className="team-builder">
                                                <h4>Simulate Match</h4>
                                                <div
                                                        style={{
                                                                display: "flex",
                                                                gap: 10,
                                                        }}
                                                >
                                                        <select
                                                                value={
                                                                        teamA?.id ||
                                                                        ""
                                                                }
                                                                onChange={(e) =>
                                                                        setTeamA(
                                                                                teams.find(
                                                                                        (
                                                                                                t,
                                                                                        ) =>
                                                                                                t.id ===
                                                                                                parseInt(
                                                                                                        e
                                                                                                                .target
                                                                                                                .value,
                                                                                                ),
                                                                                ),
                                                                        )
                                                                }
                                                        >
                                                                <option value="">
                                                                        Select
                                                                        Team A
                                                                </option>
                                                                {teams.map(
                                                                        (t) => (
                                                                                <option
                                                                                        key={
                                                                                                t.id
                                                                                        }
                                                                                        value={
                                                                                                t.id
                                                                                        }
                                                                                >
                                                                                        {
                                                                                                t.name
                                                                                        }
                                                                                </option>
                                                                        ),
                                                                )}
                                                        </select>

                                                        <select
                                                                value={
                                                                        teamB?.id ||
                                                                        ""
                                                                }
                                                                onChange={(e) =>
                                                                        setTeamB(
                                                                                teams.find(
                                                                                        (
                                                                                                t,
                                                                                        ) =>
                                                                                                t.id ===
                                                                                                parseInt(
                                                                                                        e
                                                                                                                .target
                                                                                                                .value,
                                                                                                ),
                                                                                ),
                                                                        )
                                                                }
                                                        >
                                                                <option value="">
                                                                        Select
                                                                        Team B
                                                                </option>
                                                                {teams.map(
                                                                        (t) => (
                                                                                <option
                                                                                        key={
                                                                                                t.id
                                                                                        }
                                                                                        value={
                                                                                                t.id
                                                                                        }
                                                                                >
                                                                                        {
                                                                                                t.name
                                                                                        }
                                                                                </option>
                                                                        ),
                                                                )}
                                                        </select>

                                                        <button
                                                                className="btn btn-primary"
                                                                onClick={
                                                                        handleSimulate
                                                                }
                                                                disabled={
                                                                        isSimulating
                                                                }
                                                        >
                                                                {isSimulating
                                                                        ? "Simulating..."
                                                                        : "Simulate"}
                                                        </button>
                                                        <button
                                                                className="btn btn-secondary"
                                                                onClick={() =>
                                                                        setShowSimulate(
                                                                                false,
                                                                        )
                                                                }
                                                        >
                                                                Cancel
                                                        </button>
                                                </div>
                                        </div>
                                </div>
                        )}

                        {replayMatch ? (
                                <div className="match-replay">
                                        <h3>
                                                {replayMatch.team_a.name} vs{" "}
                                                {replayMatch.team_b.name}
                                        </h3>
                                        <div className="match-result">
                                                <span className="score">
                                                        {scoreA}
                                                </span>
                                                <span className="vs">VS</span>
                                                <span className="score">
                                                        {scoreB}
                                                </span>
                                        </div>

                                        <div className="timeline">
                                                {displayTimeline.map(
                                                        (ev, idx) => (
                                                                <div
                                                                        key={
                                                                                idx
                                                                        }
                                                                        className="timeline-event"
                                                                >
                                                                        <strong>
                                                                                {
                                                                                        ev.minute
                                                                                }
                                                                                '
                                                                        </strong>{" "}
                                                                        —{" "}
                                                                        {
                                                                                ev.player_name
                                                                        }{" "}
                                                                        (
                                                                        {
                                                                                ev.team_name
                                                                        }
                                                                        ) +
                                                                        {
                                                                                ev.points
                                                                        }
                                                                </div>
                                                        ),
                                                )}
                                        </div>
                                </div>
                        ) : matches.length === 0 ? (
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
