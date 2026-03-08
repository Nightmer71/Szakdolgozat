# Month 5 — Team Builder & Stat-driven Simulation

## Goals

- Implement a Team Builder UI with drag-and-drop (or click) to add/remove players to user teams.
- Enhance the match simulation algorithm to make use of player statistics fetched from the NBA public API to produce more realistic results and a replayable timeline.
- Provide a play-by-play timeline and real-time-like replay on the frontend.

## Backend changes implemented (this commit)

- `backend/game/match_simulator.py`
     - Rewrote `simulate_match` to:
          - Extract a numeric `skill` from `Player.metadata` (supporting multiple key names such as `ppg`, `points_per_game`, nested `averages.points`, or fallback to a small baseline).
          - Simulate a minute-by-minute timeline for a configurable number of minutes (default 48).
          - Select scoring events probabilistically weighted by team/player skill.
          - Return `timeline`, `team_a_players`, `team_b_players` breakdowns and final scores.
     - Added deterministic `seed` support for reproducible results.

- `backend/game/management/commands/sync_players.py`
     - Attempt to fetch per-player stats from the public API (`/api/nba/players/{id}/stats`) when available and store them inside `Player.metadata.stats` for later use by the simulator.

## Frontend changes implemented (this commit)

- `frontend/src/components/TeamBuilder.jsx`
     - New component enabling drag-and-drop or button-based addition/removal of players to/from a team.
     - Uses existing team endpoints and player listing.

- `frontend/src/components/Pages.jsx`
     - `PlayersPage` now lets a user add a player to the currently selected team (if any).
     - `TeamsPage` includes an `Edit` action that opens the `TeamBuilder` modal to edit a team's roster.
     - `MatchesPage` includes a simple "Simulate New Match" modal and a replay UI that animates the timeline returned by the server.

- `frontend/src/api.js`
     - Fixed `addPlayerToTeam` endpoint to call the backend `add_player` action and added `removePlayerFromTeam` and `getTeam` helpers.

- Styles updated in `frontend/src/styles/Pages.css` for builder and replay UI.

## Notes & Next Steps

- The simulator uses a heuristic mapping to derive a `skill` value from whatever stats are available in `Player.metadata`. If you prefer a different mapping (e.g., weighting assists, rebounds, efficiency, or combining multiple stats), I can add a configurable mapping and unit tests.
- Improve the simulation fidelity (substitutions, minutes allocation, fatigue, fouls) as follow-up work.
- Add unit tests to ensure deterministic behavior given a `seed` and to validate edge-cases (empty roster, very unbalanced teams).
- Add a computed `summary` object to simulated matches which includes top scorers per team and a quarter-by-quarter score breakdown. This is exposed via the API and rendered alongside the replay on the frontend.
- Add frontend display for the match summary (quarter scores + top scorers) and corresponding CSS styles.
- Add serializer-level tests for summary computation that do not require a database.
- Add UI polish and better drag-and-drop UX (e.g., using a dedicated DnD lib) if desired.

---

If you'd like, I can now:

1. Add unit tests for the simulator (seed-based deterministic tests).
2. Improve the player-to-skill mapping based on exact keys returned by the public NBA API (if you want me to inspect mappings in-situ, I can run the `sync_players` command and inspect some `Player.metadata` examples).
3. Polish the frontend builder UX (modal accessibility, mobile layout, visual feedback).

Which should I prioritize next? (backend simulator tests, improved mapping, or frontend UX polish?)
