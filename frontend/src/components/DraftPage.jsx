import React, { useState, useEffect } from "react";
import api from "../api.js";
import "../styles/Draft.css";

export function DraftPage({ leagueId }) {
        const [draft, setDraft] = useState(null);
        const [picks, setPicks] = useState([]);
        const [availablePlayers, setAvailablePlayers] = useState([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);
        const [selectedPlayer, setSelectedPlayer] = useState(null);

        useEffect(() => {
                let ws;
                const initWebSocket = () => {
                        const protocol =
                                window.location.protocol === "https:"
                                        ? "wss"
                                        : "ws";
                        const host = window.location.host;
                        ws = new WebSocket(
                                `${protocol}://${host}/ws/drafts/${leagueId}/`,
                        );

                        ws.onopen = () => {
                                console.log("Draft WebSocket connected");
                        };

                        ws.onmessage = (event) => {
                                const data = JSON.parse(event.data);
                                if (
                                        data.type === "draft.state" ||
                                        data.type === "draft.update"
                                ) {
                                        const payload = data.payload || data;
                                        if (payload.draft) {
                                                setDraft(payload.draft);
                                        }
                                        if (payload.picks) {
                                                setPicks(payload.picks);
                                        }
                                        if (payload.available_players) {
                                                setAvailablePlayers(
                                                        payload.available_players,
                                                );
                                        }
                                }
                        };

                        ws.onclose = () => {
                                console.log("Draft WebSocket disconnected");
                        };

                        ws.onerror = (err) => {
                                console.error("Draft WebSocket error", err);
                        };
                };

                loadDraft();
                initWebSocket();

                return () => {
                        if (ws) {
                                ws.close();
                        }
                };
        }, [leagueId]);

        const loadDraft = async () => {
                try {
                        setLoading(true);
                        const draftData = await api.getDraft(leagueId);
                        setDraft(draftData);

                        if (draftData.status === "active") {
                                try {
                                        const picksData =
                                                await api.getDraftPicks(
                                                        leagueId,
                                                );
                                        setPicks(picksData);
                                } catch (picksError) {
                                        console.error(
                                                "Failed to load picks:",
                                                picksError,
                                        );
                                        setPicks([]);
                                }
                                try {
                                        const playersData =
                                                await api.getAvailablePlayers(
                                                        leagueId,
                                                );
                                        setAvailablePlayers(playersData);
                                } catch (playersError) {
                                        console.error(
                                                "Failed to load available players:",
                                                playersError,
                                        );
                                        setAvailablePlayers([]);
                                }
                        }
                } catch (err) {
                        if (
                                err.message.includes("404") ||
                                err.message.includes("No draft found")
                        ) {
                                setError(
                                        "No draft has been created for this league yet.",
                                );
                        } else {
                                setError(
                                        "Failed to load draft: " + err.message,
                                );
                        }
                } finally {
                        setLoading(false);
                }
        };

        const handleCreateDraft = async () => {
                try {
                        const newDraft = await api.createDraft(leagueId);
                        setDraft(newDraft);
                        setError(null);
                } catch (err) {
                        setError("Failed to create draft: " + err.message);
                }
        };

        const handleStartDraft = async () => {
                try {
                        const startedDraft = await api.startDraft(leagueId);
                        setDraft(startedDraft);
                        // Load picks and available players
                        try {
                                const picksData =
                                        await api.getDraftPicks(leagueId);
                                setPicks(picksData);
                        } catch (picksError) {
                                console.error(
                                        "Failed to load picks:",
                                        picksError,
                                );
                                setPicks([]);
                        }
                        try {
                                const playersData =
                                        await api.getAvailablePlayers(leagueId);
                                setAvailablePlayers(playersData);
                        } catch (playersError) {
                                console.error(
                                        "Failed to load available players:",
                                        playersError,
                                );
                                setAvailablePlayers([]);
                        }
                        setError(null);
                } catch (err) {
                        setError("Failed to start draft: " + err.message);
                }
        };

        const handleMakePick = async () => {
                if (!selectedPlayer) return;

                try {
                        const pick = await api.makeDraftPick(
                                leagueId,
                                selectedPlayer.id,
                        );
                        setPicks((prev) => [...prev, pick]);

                        // Update available players
                        setAvailablePlayers((prev) =>
                                prev.filter((p) => p.id !== selectedPlayer.id),
                        );

                        // Update draft state
                        const updatedDraft = await api.getDraft(leagueId);
                        setDraft(updatedDraft);

                        setSelectedPlayer(null);
                        setError(null);
                } catch (err) {
                        setError("Failed to make pick: " + err.message);
                }
        };

        if (loading) {
                return (
                        <div className="draft-page">
                                <div className="loading">Loading draft...</div>
                        </div>
                );
        }

        if (error && !draft) {
                return (
                        <div className="draft-page">
                                <div className="draft-header">
                                        <h1>League Draft</h1>
                                        <button
                                                onClick={() =>
                                                        (window.location.href = `/league/${leagueId}`)
                                                }
                                                className="btn btn-secondary"
                                        >
                                                ← Back to League
                                        </button>
                                </div>
                                <div className="draft-error">
                                        <p>{error}</p>
                                        <button
                                                onClick={handleCreateDraft}
                                                className="btn btn-primary"
                                        >
                                                Create Draft
                                        </button>
                                </div>
                        </div>
                );
        }

        return (
                <div className="draft-page">
                        <div className="draft-header">
                                <h1>Draft - {draft?.league?.name}</h1>
                                <button
                                        onClick={() =>
                                                (window.location.href = `/league/${leagueId}`)
                                        }
                                        className="btn btn-secondary"
                                >
                                        ← Back to League
                                </button>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <div className="draft-content">
                                {draft.status === "pending" && (
                                        <DraftLobby
                                                draft={draft}
                                                onStart={handleStartDraft}
                                        />
                                )}

                                {draft.status === "active" && (
                                        <DraftBoard
                                                draft={draft}
                                                picks={picks}
                                                availablePlayers={
                                                        availablePlayers
                                                }
                                                selectedPlayer={selectedPlayer}
                                                onSelectPlayer={
                                                        setSelectedPlayer
                                                }
                                                onMakePick={handleMakePick}
                                        />
                                )}

                                {draft.status === "completed" && (
                                        <DraftCompleted
                                                draft={draft}
                                                picks={picks}
                                        />
                                )}
                        </div>
                </div>
        );
}

function DraftLobby({ draft, onStart }) {
        return (
                <div className="draft-lobby">
                        <h2>Draft Lobby</h2>
                        <div className="draft-info">
                                <p>
                                        <strong>League:</strong>{" "}
                                        {draft.league.name}
                                </p>
                                <p>
                                        <strong>Total Rounds:</strong>{" "}
                                        {draft.total_rounds}
                                </p>
                                <p>
                                        <strong>Total Teams:</strong>{" "}
                                        {draft.total_teams}
                                </p>
                                <p>
                                        <strong>Total Picks:</strong>{" "}
                                        {draft.total_picks}
                                </p>
                        </div>
                        <div className="draft-pick-order">
                                <h3>Draft Order</h3>
                                {draft.pick_order.map((round, index) => (
                                        <div
                                                key={index}
                                                className="draft-round"
                                        >
                                                <strong>
                                                        Round {index + 1}:
                                                </strong>
                                                {round.map((teamId) => {
                                                        // In a real app, you'd have team names, but for now just show IDs
                                                        return (
                                                                <span
                                                                        key={
                                                                                teamId
                                                                        }
                                                                        className="team-pick"
                                                                >
                                                                        Team{" "}
                                                                        {teamId}
                                                                </span>
                                                        );
                                                })}
                                        </div>
                                ))}
                        </div>
                        <button
                                onClick={onStart}
                                className="btn btn-primary btn-large"
                        >
                                Start Draft
                        </button>
                </div>
        );
}

function DraftBoard({
        draft,
        picks,
        availablePlayers,
        selectedPlayer,
        onSelectPlayer,
        onMakePick,
}) {
        const isMyTurn =
                draft.current_team &&
                draft.current_team.owner ===
                        parseInt(localStorage.getItem("user_id"));

        return (
                <div className="draft-board">
                        <div className="draft-status">
                                <h2>Draft in Progress</h2>
                                <div className="current-pick">
                                        <p>
                                                <strong>Round:</strong>{" "}
                                                {draft.current_round}
                                        </p>
                                        <p>
                                                <strong>Pick:</strong>{" "}
                                                {draft.current_pick}
                                        </p>
                                        <p>
                                                <strong>Current Team:</strong>{" "}
                                                {draft.current_team?.name ||
                                                        "None"}
                                        </p>
                                        {isMyTurn && (
                                                <p className="your-turn">
                                                        🎯 It's your turn!
                                                </p>
                                        )}
                                </div>
                        </div>

                        <div className="draft-main">
                                <div className="available-players">
                                        <h3>Available Players</h3>
                                        <div className="players-grid">
                                                {availablePlayers.map(
                                                        (player) => (
                                                                <div
                                                                        key={
                                                                                player.id
                                                                        }
                                                                        className={`player-card ${selectedPlayer?.id === player.id ? "selected" : ""}`}
                                                                        onClick={() =>
                                                                                onSelectPlayer(
                                                                                        player,
                                                                                )
                                                                        }
                                                                >
                                                                        <h4>
                                                                                {
                                                                                        player.name
                                                                                }
                                                                        </h4>
                                                                        <p>
                                                                                {
                                                                                        player.position
                                                                                }{" "}
                                                                                -{" "}
                                                                                {
                                                                                        player.team
                                                                                }
                                                                        </p>
                                                                        <div className="player-stats">
                                                                                <span>
                                                                                        PPG:{" "}
                                                                                        {
                                                                                                player.points_per_game
                                                                                        }
                                                                                </span>
                                                                                <span>
                                                                                        APG:{" "}
                                                                                        {
                                                                                                player.assists_per_game
                                                                                        }
                                                                                </span>
                                                                                <span>
                                                                                        RPG:{" "}
                                                                                        {
                                                                                                player.rebounds_per_game
                                                                                        }
                                                                                </span>
                                                                        </div>
                                                                </div>
                                                        ),
                                                )}
                                        </div>
                                </div>

                                <div className="draft-sidebar">
                                        {selectedPlayer && (
                                                <div className="selected-player">
                                                        <h3>Selected Player</h3>
                                                        <div className="player-card selected">
                                                                <h4>
                                                                        {
                                                                                selectedPlayer.name
                                                                        }
                                                                </h4>
                                                                <p>
                                                                        {
                                                                                selectedPlayer.position
                                                                        }{" "}
                                                                        -{" "}
                                                                        {
                                                                                selectedPlayer.team
                                                                        }
                                                                </p>
                                                                <div className="player-stats">
                                                                        <span>
                                                                                PPG:{" "}
                                                                                {
                                                                                        selectedPlayer.points_per_game
                                                                                }
                                                                        </span>
                                                                        <span>
                                                                                APG:{" "}
                                                                                {
                                                                                        selectedPlayer.assists_per_game
                                                                                }
                                                                        </span>
                                                                        <span>
                                                                                RPG:{" "}
                                                                                {
                                                                                        selectedPlayer.rebounds_per_game
                                                                                }
                                                                        </span>
                                                                </div>
                                                        </div>
                                                        {isMyTurn && (
                                                                <button
                                                                        onClick={
                                                                                onMakePick
                                                                        }
                                                                        className="btn btn-primary"
                                                                >
                                                                        Make
                                                                        Pick
                                                                </button>
                                                        )}
                                                </div>
                                        )}

                                        <div className="recent-picks">
                                                <h3>Recent Picks</h3>
                                                <div className="picks-list">
                                                        {picks
                                                                .slice(-5)
                                                                .reverse()
                                                                .map((pick) => (
                                                                        <div
                                                                                key={
                                                                                        pick.id
                                                                                }
                                                                                className="pick-item"
                                                                        >
                                                                                <span className="pick-number">
                                                                                        #
                                                                                        {
                                                                                                pick.pick_number
                                                                                        }
                                                                                </span>
                                                                                <span className="team-name">
                                                                                        {
                                                                                                pick
                                                                                                        .team
                                                                                                        .name
                                                                                        }
                                                                                </span>
                                                                                <span className="player-name">
                                                                                        {
                                                                                                pick
                                                                                                        .player
                                                                                                        .name
                                                                                        }
                                                                                </span>
                                                                        </div>
                                                                ))}
                                                </div>
                                        </div>
                                </div>
                        </div>
                </div>
        );
}

function DraftCompleted({ draft, picks }) {
        // Group picks by team
        const teamPicks = {};
        picks.forEach((pick) => {
                if (!teamPicks[pick.team.id]) {
                        teamPicks[pick.team.id] = {
                                team: pick.team,
                                players: [],
                        };
                }
                teamPicks[pick.team.id].players.push(pick.player);
        });

        return (
                <div className="draft-completed">
                        <h2>Draft Completed!</h2>
                        <div className="draft-results">
                                {Object.values(teamPicks).map(
                                        ({ team, players }) => (
                                                <div
                                                        key={team.id}
                                                        className="team-roster"
                                                >
                                                        <h3>{team.name}</h3>
                                                        <div className="roster-players">
                                                                {players.map(
                                                                        (
                                                                                player,
                                                                        ) => (
                                                                                <div
                                                                                        key={
                                                                                                player.id
                                                                                        }
                                                                                        className="roster-player"
                                                                                >
                                                                                        <span className="player-name">
                                                                                                {
                                                                                                        player.name
                                                                                                }
                                                                                        </span>
                                                                                        <span className="player-position">
                                                                                                (
                                                                                                {
                                                                                                        player.position
                                                                                                }

                                                                                                )
                                                                                        </span>
                                                                                </div>
                                                                        ),
                                                                )}
                                                        </div>
                                                </div>
                                        ),
                                )}
                        </div>
                </div>
        );
}
