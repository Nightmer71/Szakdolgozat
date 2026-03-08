import React, { useEffect, useState } from "react";
import api from "../api";
import "../styles/Pages.css";

export default function TeamBuilder({ team, onClose, onUpdated }) {
        const [availablePlayers, setAvailablePlayers] = useState([]);
        const [teamData, setTeamData] = useState(team || { roster: [] });
        const [isLoading, setIsLoading] = useState(false);
        const [actionLoading, setActionLoading] = useState(false);
        const [draggingOver, setDraggingOver] = useState(false);

        useEffect(() => {
                loadAvailablePlayers();
                refreshTeam();
                // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [team]);

        const loadAvailablePlayers = async () => {
                try {
                        const resp = await api.getPlayers(1, "");
                        const players = resp.results || resp;
                        setAvailablePlayers(players);
                } catch (err) {
                        console.error("Failed to load players", err);
                }
        };

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

        const allowDrop = (e) => {
                e.preventDefault();
        };

        const handleDragEnter = (e) => {
                e.preventDefault();
                setDraggingOver(true);
        };

        const handleDragLeave = (e) => {
                e.preventDefault();
                setDraggingOver(false);
        };

        const handleDrop = async (e) => {
                e.preventDefault();
                setDraggingOver(false);
                const playerId = e.dataTransfer.getData("text/player-id");
                if (!playerId || !team) return;
                try {
                        setActionLoading(true);
                        await api.addPlayerToTeam(team.id, playerId);
                        await refreshTeam();
                } catch (err) {
                        console.error("Failed to add player", err);
                } finally {
                        setActionLoading(false);
                }
        };

        const startDrag = (e, playerId) => {
                try {
                        e.dataTransfer.setData("text/player-id", playerId);
                } catch (err) {
                        // ignore
                }
        };

        const handleAddClick = async (playerId) => {
                if (!team) return alert("Select a team first to add players");
                try {
                        setActionLoading(true);
                        await api.addPlayerToTeam(team.id, playerId);
                        await refreshTeam();
                } catch (err) {
                        console.error("Failed to add player", err);
                } finally {
                        setActionLoading(false);
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
                                        aria-label="available players"
                                >
                                        <h4>Available Players</h4>
                                        <div className="players-list">
                                                {availablePlayers.map((p) => (
                                                        <div
                                                                key={p.id}
                                                                className="player-card small"
                                                                draggable
                                                                onDragStart={(
                                                                        e,
                                                                ) =>
                                                                        startDrag(
                                                                                e,
                                                                                p.id,
                                                                        )
                                                                }
                                                                onClick={() =>
                                                                        handleAddClick(
                                                                                p.id,
                                                                        )
                                                                }
                                                        >
                                                                <div
                                                                        style={{
                                                                                flex: 1,
                                                                        }}
                                                                >
                                                                        <strong>
                                                                                {
                                                                                        p.name
                                                                                }
                                                                        </strong>
                                                                        <p>
                                                                                {
                                                                                        p.position
                                                                                }
                                                                        </p>
                                                                </div>
                                                                <button
                                                                        className="btn btn-small"
                                                                        disabled={
                                                                                actionLoading
                                                                        }
                                                                        aria-busy={
                                                                                actionLoading
                                                                        }
                                                                        onClick={() =>
                                                                                handleAddClick(
                                                                                        p.id,
                                                                                )
                                                                        }
                                                                >
                                                                        {actionLoading
                                                                                ? "..."
                                                                                : "Add"}
                                                                </button>
                                                        </div>
                                                ))}
                                        </div>
                                </div>

                                <div
                                        className={`team-roster drop-zone ${draggingOver ? "drop-active" : ""}`}
                                        role="listbox"
                                        aria-label={`Roster for ${team?.name}`}
                                        onDrop={handleDrop}
                                        onDragOver={allowDrop}
                                        onDragEnter={handleDragEnter}
                                        onDragLeave={handleDragLeave}
                                >
                                        <h4>Team Roster</h4>
                                        {isLoading ? (
                                                <p>Loading roster...</p>
                                        ) : (
                                                <div className="players-list">
                                                        {teamData?.roster
                                                                ?.length ===
                                                        0 ? (
                                                                <p>
                                                                        No
                                                                        players
                                                                        in
                                                                        roster
                                                                </p>
                                                        ) : (
                                                                teamData.roster.map(
                                                                        (r) => (
                                                                                <div
                                                                                        key={
                                                                                                r.id
                                                                                        }
                                                                                        className="player-card small"
                                                                                >
                                                                                        <div
                                                                                                style={{
                                                                                                        flex: 1,
                                                                                                }}
                                                                                        >
                                                                                                <strong>
                                                                                                        {
                                                                                                                r
                                                                                                                        .player
                                                                                                                        .name
                                                                                                        }
                                                                                                </strong>
                                                                                                <p>
                                                                                                        {
                                                                                                                r
                                                                                                                        .player
                                                                                                                        .position
                                                                                                        }
                                                                                                </p>
                                                                                        </div>
                                                                                        <div
                                                                                                style={{
                                                                                                        display: "flex",
                                                                                                        gap: 8,
                                                                                                }}
                                                                                        >
                                                                                                <button
                                                                                                        className={`btn btn-small ${r.is_active ? "btn-primary" : ""}`}
                                                                                                        onClick={() =>
                                                                                                                handleToggleActive(
                                                                                                                        r
                                                                                                                                .player
                                                                                                                                .id,
                                                                                                                        r.is_active,
                                                                                                                )
                                                                                                        }
                                                                                                        aria-pressed={
                                                                                                                r.is_active
                                                                                                        }
                                                                                                        disabled={
                                                                                                                actionLoading
                                                                                                        }
                                                                                                >
                                                                                                        {r.is_active
                                                                                                                ? "Active"
                                                                                                                : "Bench"}
                                                                                                </button>
                                                                                                <button
                                                                                                        className="btn btn-danger btn-small"
                                                                                                        onClick={() =>
                                                                                                                handleRemove(
                                                                                                                        r
                                                                                                                                .player
                                                                                                                                .id,
                                                                                                                )
                                                                                                        }
                                                                                                        disabled={
                                                                                                                actionLoading
                                                                                                        }
                                                                                                >
                                                                                                        {actionLoading
                                                                                                                ? "..."
                                                                                                                : "Remove"}
                                                                                                </button>
                                                                                        </div>
                                                                                </div>
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
