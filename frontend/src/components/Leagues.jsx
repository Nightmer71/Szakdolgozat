import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import api from "../api";
import "../styles/League.css";

export function LeagueListPage() {
        const { isAuthenticated, user } = useAuth();
        const [leagues, setLeagues] = useState([]);
        const [showCreate, setShowCreate] = useState(false);
        const [newLeagueName, setNewLeagueName] = useState("");
        const [loading, setLoading] = useState(false);

        useEffect(() => {
                const loadLeagues = async () => {
                        try {
                                setLoading(true);
                                const data = await api.getLeagues();
                                setLeagues(data.results || data);
                        } catch (err) {
                                console.error("Failed to load leagues", err);
                        } finally {
                                setLoading(false);
                        }
                };
                loadLeagues();
        }, []);

        const handleCreateLeague = async (e) => {
                e.preventDefault();
                if (!newLeagueName.trim()) return alert("League name required");
                try {
                        const created = await api.createLeague(newLeagueName);
                        setLeagues([...leagues, created]);
                        setNewLeagueName("");
                        setShowCreate(false);
                } catch (err) {
                        console.error("Failed to create league", err);
                        alert("Failed to create league");
                }
        };

        const handleDeleteLeague = async (leagueId) => {
                if (
                        !window.confirm(
                                "Are you sure you want to delete this league? This will also delete all associated matches, drafts, and memberships. This action cannot be undone.",
                        )
                ) {
                        return;
                }

                try {
                        await api.deleteLeague(leagueId);
                        setLeagues(leagues.filter((l) => l.id !== leagueId));
                } catch (err) {
                        console.error("Failed to delete league", err);
                        alert(`Failed to delete league: ${err.message}`);
                }
        };

        if (!isAuthenticated) return <div>Please log in.</div>;

        return (
                <div className="page-container">
                        <h2>Leagues</h2>
                        <button
                                className="btn btn-primary"
                                onClick={() => setShowCreate(!showCreate)}
                        >
                                + Create League
                        </button>

                        {showCreate && (
                                <form
                                        className="form-container"
                                        onSubmit={handleCreateLeague}
                                >
                                        <input
                                                type="text"
                                                placeholder="League name"
                                                value={newLeagueName}
                                                onChange={(e) =>
                                                        setNewLeagueName(
                                                                e.target.value,
                                                        )
                                                }
                                        />
                                        <button
                                                type="submit"
                                                className="btn btn-primary"
                                        >
                                                Create
                                        </button>
                                        <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() =>
                                                        setShowCreate(false)
                                                }
                                        >
                                                Cancel
                                        </button>
                                </form>
                        )}

                        {loading ? (
                                <p>Loading leagues...</p>
                        ) : leagues.length === 0 ? (
                                <p>No leagues yet.</p>
                        ) : (
                                <div className="leagues-grid">
                                        {leagues.map((league) => (
                                                <div
                                                        key={league.id}
                                                        className="card league-card"
                                                >
                                                        <h3>{league.name}</h3>
                                                        <p>
                                                                Owner:{" "}
                                                                {
                                                                        league
                                                                                .owner
                                                                                .username
                                                                }
                                                        </p>
                                                        <p>
                                                                Teams:{" "}
                                                                {league.members
                                                                        ?.length ||
                                                                        0}
                                                        </p>
                                                        <div className="league-actions">
                                                                <button
                                                                        className="btn btn-small"
                                                                        onClick={() =>
                                                                                (window.location.href = `/league/${league.id}`)
                                                                        }
                                                                >
                                                                        View
                                                                        Details
                                                                </button>
                                                                {user &&
                                                                        league
                                                                                .owner
                                                                                .username ===
                                                                                user.username && (
                                                                                <button
                                                                                        className="btn btn-small btn-danger"
                                                                                        onClick={() =>
                                                                                                handleDeleteLeague(
                                                                                                        league.id,
                                                                                                )
                                                                                        }
                                                                                >
                                                                                        Delete
                                                                                </button>
                                                                        )}
                                                        </div>
                                                </div>
                                        ))}
                                </div>
                        )}
                </div>
        );
}

export function LeagueDetailPage({ leagueId }) {
        const { teams } = useData();
        const [league, setLeague] = useState(null);
        const [standings, setStandings] = useState([]);
        const [schedule, setSchedule] = useState([]);
        const [selectedTeam, setSelectedTeam] = useState(null);
        const [loading, setLoading] = useState(false);

        const handleLoadLeague = async () => {
                try {
                        setLoading(true);
                        const leagueData = await api.getLeague(leagueId);
                        setLeague(leagueData);
                        setStandings(leagueData.standings || []);
                } catch (err) {
                        console.error("Failed to load league", err);
                } finally {
                        setLoading(false);
                }
        };

        useEffect(() => {
                handleLoadLeague();
        }, [leagueId]);

        const handleLoadSchedule = async () => {
                try {
                        const data = await api.getLeagueSchedule(leagueId);
                        setSchedule(data.schedule || []);
                } catch (err) {
                        console.error("Failed to load schedule", err);
                }
        };

        const handleJoinTeam = async () => {
                if (!selectedTeam) return alert("Select a team");
                try {
                        await api.joinLeague(leagueId, selectedTeam.id);
                        alert("Team joined!");
                        handleLoadLeague();
                } catch (err) {
                        console.error("Failed to join league", err);
                        alert("Failed to join");
                }
        };

        const handleLeaveTeam = async (teamId) => {
                if (!window.confirm("Leave league with this team?")) return;
                try {
                        await api.leaveLeague(leagueId, teamId);
                        alert("Team left!");
                        handleLoadLeague();
                } catch (err) {
                        console.error("Failed to leave", err);
                        alert("Failed to leave");
                }
        };

        return (
                <div className="page-container">
                        {loading ? (
                                <p>Loading league...</p>
                        ) : !league ? (
                                <p>League not found.</p>
                        ) : (
                                <>
                                        <h2>{league.name}</h2>
                                        <p>Owner: {league.owner.username}</p>

                                        <div className="league-section">
                                                <h3>Standings</h3>
                                                {standings.length === 0 ? (
                                                        <p>No standings yet.</p>
                                                ) : (
                                                        <table className="standings-table">
                                                                <thead>
                                                                        <tr>
                                                                                <th>
                                                                                        Rank
                                                                                </th>
                                                                                <th>
                                                                                        Team
                                                                                </th>
                                                                                <th>
                                                                                        Wins
                                                                                </th>
                                                                                <th>
                                                                                        Losses
                                                                                </th>
                                                                                <th>
                                                                                        Points
                                                                                        For
                                                                                </th>
                                                                                <th>
                                                                                        Points
                                                                                        Against
                                                                                </th>
                                                                        </tr>
                                                                </thead>
                                                                <tbody>
                                                                        {standings.map(
                                                                                (
                                                                                        row,
                                                                                        idx,
                                                                                ) => (
                                                                                        <tr
                                                                                                key={
                                                                                                        idx
                                                                                                }
                                                                                        >
                                                                                                <td>
                                                                                                        {idx +
                                                                                                                1}
                                                                                                </td>
                                                                                                <td>
                                                                                                        {
                                                                                                                row.team_name
                                                                                                        }
                                                                                                </td>
                                                                                                <td>
                                                                                                        {
                                                                                                                row.wins
                                                                                                        }
                                                                                                </td>
                                                                                                <td>
                                                                                                        {
                                                                                                                row.losses
                                                                                                        }
                                                                                                </td>
                                                                                                <td>
                                                                                                        {
                                                                                                                row.points_for
                                                                                                        }
                                                                                                </td>
                                                                                                <td>
                                                                                                        {
                                                                                                                row.points_against
                                                                                                        }
                                                                                                </td>
                                                                                        </tr>
                                                                                ),
                                                                        )}
                                                                </tbody>
                                                        </table>
                                                )}
                                                <button
                                                        className="btn btn-small"
                                                        onClick={
                                                                handleLoadSchedule
                                                        }
                                                >
                                                        View Schedule
                                                </button>
                                        </div>

                                        <div className="league-section">
                                                <h3>Draft</h3>
                                                <p>
                                                        Organize a player draft
                                                        for this league.
                                                </p>
                                                <button
                                                        className="btn btn-primary"
                                                        onClick={() =>
                                                                (window.location.href = `/draft/${leagueId}`)
                                                        }
                                                >
                                                        🏆 Go to Draft
                                                </button>
                                        </div>

                                        {schedule.length > 0 && (
                                                <div className="league-section">
                                                        <h3>Schedule</h3>
                                                        <div className="matches-list">
                                                                {schedule.map(
                                                                        (
                                                                                match,
                                                                        ) => (
                                                                                <div
                                                                                        key={
                                                                                                match.id
                                                                                        }
                                                                                        className="match-item"
                                                                                >
                                                                                        <strong>
                                                                                                {
                                                                                                        match
                                                                                                                .team_a
                                                                                                                .name
                                                                                                }
                                                                                        </strong>{" "}
                                                                                        vs{" "}
                                                                                        <strong>
                                                                                                {
                                                                                                        match
                                                                                                                .team_b
                                                                                                                .name
                                                                                                }
                                                                                        </strong>
                                                                                        {match.result ? (
                                                                                                <span className="result">
                                                                                                        {
                                                                                                                match
                                                                                                                        .result
                                                                                                                        .team_a_score
                                                                                                        }{" "}
                                                                                                        -{" "}
                                                                                                        {
                                                                                                                match
                                                                                                                        .result
                                                                                                                        .team_b_score
                                                                                                        }
                                                                                                </span>
                                                                                        ) : (
                                                                                                <span className="status">
                                                                                                        Pending
                                                                                                </span>
                                                                                        )}
                                                                                </div>
                                                                        ),
                                                                )}
                                                        </div>
                                                </div>
                                        )}

                                        <div className="league-section">
                                                <h3>Join Team</h3>
                                                <div
                                                        style={{
                                                                display: "flex",
                                                                gap: 10,
                                                        }}
                                                >
                                                        <select
                                                                value={
                                                                        selectedTeam?.id ||
                                                                        ""
                                                                }
                                                                onChange={(e) =>
                                                                        setSelectedTeam(
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
                                                                        your
                                                                        team
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
                                                                        handleJoinTeam
                                                                }
                                                        >
                                                                Join
                                                        </button>
                                                </div>
                                        </div>

                                        {league.members &&
                                                league.members.length > 0 && (
                                                        <div className="league-section">
                                                                <h3>Members</h3>
                                                                {league.members.map(
                                                                        (m) => (
                                                                                <div
                                                                                        key={
                                                                                                m.id
                                                                                        }
                                                                                        className="member-item"
                                                                                >
                                                                                        <span>
                                                                                                {
                                                                                                        m
                                                                                                                .team
                                                                                                                .name
                                                                                                }
                                                                                        </span>
                                                                                        {user?.id ===
                                                                                                m
                                                                                                        .team
                                                                                                        .owner
                                                                                                        ?.id && (
                                                                                                <button
                                                                                                        className="btn btn-small btn-danger"
                                                                                                        onClick={() =>
                                                                                                                handleLeaveTeam(
                                                                                                                        m
                                                                                                                                .team
                                                                                                                                .id,
                                                                                                                )
                                                                                                        }
                                                                                                >
                                                                                                        Leave
                                                                                                </button>
                                                                                        )}
                                                                                </div>
                                                                        ),
                                                                )}
                                                        </div>
                                                )}
                                </>
                        )}
                </div>
        );
}
