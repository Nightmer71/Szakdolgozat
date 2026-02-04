import React, { useEffect, useState } from "react";
import api from "../api";
import "../styles/Pages.css";

export default function TeamBuilder({ team, onClose, onUpdated }) {
        const [availablePlayers, setAvailablePlayers] = useState([]);
        const [teamData, setTeamData] = useState(team);
        const [isLoading, setIsLoading] = useState(false);

        useEffect(() => {
                loadAvailablePlayers();
                refreshTeam();
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

        const handleDrop = async (e) => {
                e.preventDefault();
                const playerId = e.dataTransfer.getData("text/player-id");
                if (!playerId) return;
                try {
                        await api.addPlayerToTeam(team.id, playerId);
                        await refreshTeam();
                } catch (err) {
                        console.error("Failed to add player", err);
                }
        };

        const allowDrop = (e) => e.preventDefault();

        const startDrag = (e, playerId) => {
                e.dataTransfer.setData("text/player-id", playerId);
        };

        const handleAddClick = async (playerId) => {
                try {
                        await api.addPlayerToTeam(team.id, playerId);
                        await refreshTeam();
                } catch (err) {
                        console.error("Failed to add player", err);
                }
        };

        const handleRemove = async (playerId) => {
                try {
                        await api.removePlayerFromTeam(team.id, playerId);
                        await refreshTeam();
                } catch (err) {
                        console.error("Failed to remove player", err);
                }
        };

        return (
                <div className="team-builder">
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
                                        onDragOver={allowDrop}
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
                                                        >
                                                                <strong>
                                                                        {p.name}
                                                                </strong>
                                                                <p>
                                                                        {
                                                                                p.position
                                                                        }
                                                                </p>
                                                                <button
                                                                        className="btn btn-small"
                                                                        onClick={() =>
                                                                                handleAddClick(
                                                                                        p.id,
                                                                                )
                                                                        }
                                                                >
                                                                        Add
                                                                </button>
                                                        </div>
                                                ))}
                                        </div>
                                </div>

                                <div
                                        className="team-roster drop-zone"
                                        onDrop={handleDrop}
                                        onDragOver={allowDrop}
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
                                                                                        <button
                                                                                                className="btn btn-danger btn-small"
                                                                                                onClick={() =>
                                                                                                        handleRemove(
                                                                                                                r
                                                                                                                        .player
                                                                                                                        .id,
                                                                                                        )
                                                                                                }
                                                                                        >
                                                                                                Remove
                                                                                        </button>
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
