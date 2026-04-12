import { useEffect, useState } from "react";
import api from "../api";
import "../styles/Pages.css";

export default function TeamBuilder({ team, onClose, onUpdated }) {
        const [teamData, setTeamData] = useState(team || { roster: [] });
        const [isLoading, setIsLoading] = useState(false);
        const [actionLoading, setActionLoading] = useState(false);

        useEffect(() => {
                refreshTeam();
        }, [team]);

        const refreshTeam = async () => {
                if (!team) return;
                try {
                        setIsLoading(true);
                        const updated = await api.getTeam(team.id);
                        setTeamData(updated);
                        onUpdated && onUpdated(updated);
                } catch (err) {
                        console.error("Failed to refresh team", err);
                } finally {
                        setIsLoading(false);
                }
        };

        const handleRemove = async (playerId) => {
                if (!team) return;
                try {
                        setActionLoading(true);
                        await api.removePlayerFromTeam(team.id, playerId);
                        await refreshTeam();
                } catch (err) {
                        console.error("Failed to remove player", err);
                } finally {
                        setActionLoading(false);
                }
        };

        const handleToggleActive = async (playerId, current) => {
                if (!team) return;
                try {
                        setActionLoading(true);
                        await api.setPlayerActive(team.id, playerId, !current);
                        await refreshTeam();
                } catch (err) {
                        console.error("Failed to toggle active", err);
                } finally {
                        setActionLoading(false);
                }
        };

        const benchPlayers =
                teamData?.roster?.filter((r) => !r.is_active) ?? [];
        const activePlayers =
                teamData?.roster?.filter((r) => r.is_active) ?? [];

        const renderRosterEntry = (r, showActivate) => (
                <div key={r.id} className="player-card small">
                        <div style={{ flex: 1 }}>
                                <strong>{r.player.name}</strong>
                                <p>{r.player.position}</p>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                                <button
                                        className="btn btn-small btn-primary"
                                        onClick={() =>
                                                handleToggleActive(
                                                        r.player.id,
                                                        r.is_active,
                                                )
                                        }
                                        disabled={actionLoading}
                                >
                                        {showActivate ? "Activate" : "Bench"}
                                </button>
                                <button
                                        className="btn btn-danger btn-small"
                                        onClick={() =>
                                                handleRemove(r.player.id)
                                        }
                                        disabled={actionLoading}
                                >
                                        Remove
                                </button>
                        </div>
                </div>
        );

        return (
                <div className="team-builder" aria-live="polite">
                        <div className="team-builder-header">
                                <h3>Editing: {team?.name}</h3>
                                <button
                                        className="btn btn-secondary"
                                        onClick={onClose}
                                >
                                        Close
                                </button>
                        </div>

                        <div className="team-builder-content">
                                <div
                                        className="available-players"
                                        role="listbox"
                                        aria-label="bench players"
                                >
                                        <h4>Drafted Players (Bench)</h4>
                                        {isLoading ? (
                                                <p>Loading...</p>
                                        ) : (
                                                <div className="players-list">
                                                        {benchPlayers.length ===
                                                        0 ? (
                                                                <p>
                                                                        No bench
                                                                        players
                                                                </p>
                                                        ) : (
                                                                benchPlayers.map(
                                                                        (r) =>
                                                                                renderRosterEntry(
                                                                                        r,
                                                                                        true,
                                                                                ),
                                                                )
                                                        )}
                                                </div>
                                        )}
                                </div>

                                <div
                                        className="team-roster"
                                        role="listbox"
                                        aria-label={`Starting lineup for ${team?.name}`}
                                >
                                        <h4>Starting Lineup</h4>
                                        {isLoading ? (
                                                <p>Loading...</p>
                                        ) : (
                                                <div className="players-list">
                                                        {activePlayers.length ===
                                                        0 ? (
                                                                <p>
                                                                        No
                                                                        active
                                                                        players
                                                                        —
                                                                        activate
                                                                        players
                                                                        from the
                                                                        bench
                                                                </p>
                                                        ) : (
                                                                activePlayers.map(
                                                                        (r) =>
                                                                                renderRosterEntry(
                                                                                        r,
                                                                                        false,
                                                                                ),
                                                                )
                                                        )}
                                                </div>
                                        )}
                                </div>
                        </div>
                </div>
        );
}
