// API client for communicating with Django backend
const API_BASE_URL =
        import.meta.env.VITE_API_URL || "http://localhost:8000/api";

class APIClient {
        constructor(baseURL = API_BASE_URL) {
                this.baseURL = baseURL;
                this.isRefreshing = false;
                this.refreshSubscribers = [];
        }

        onRefreshed(token) {
                this.refreshSubscribers.forEach((callback) => callback(token));
                this.refreshSubscribers = [];
        }

        addRefreshSubscriber(callback) {
                this.refreshSubscribers.push(callback);
        }

        async refreshAccessToken() {
                if (this.isRefreshing) {
                        return new Promise((resolve) => {
                                this.addRefreshSubscriber((token) => {
                                        resolve(token);
                                });
                        });
                }

                this.isRefreshing = true;
                const refreshToken = localStorage.getItem("refresh_token");

                if (!refreshToken) {
                        this.isRefreshing = false;
                        throw new Error("No refresh token available");
                }

                try {
                        const response = await fetch(
                                `${this.baseURL}/auth/token/refresh/`,
                                {
                                        method: "POST",
                                        headers: {
                                                "Content-Type":
                                                        "application/json",
                                        },
                                        body: JSON.stringify({
                                                refresh: refreshToken,
                                        }),
                                },
                        );

                        if (!response.ok) {
                                localStorage.removeItem("access_token");
                                localStorage.removeItem("refresh_token");
                                throw new Error("Token refresh failed");
                        }

                        const data = await response.json();
                        localStorage.setItem("access_token", data.access);
                        this.isRefreshing = false;
                        this.onRefreshed(data.access);
                        return data.access;
                } catch (error) {
                        this.isRefreshing = false;
                        localStorage.removeItem("access_token");
                        localStorage.removeItem("refresh_token");
                        throw error;
                }
        }

        async request(endpoint, options = {}) {
                const url = `${this.baseURL}${endpoint}`;
                let token = localStorage.getItem("access_token");

                const headers = {
                        "Content-Type": "application/json",
                        ...options.headers,
                };

                if (token) {
                        headers["Authorization"] = `Bearer ${token}`;
                }

                try {
                        let response = await fetch(url, {
                                ...options,
                                headers,
                        });

                        // If 401 Unauthorized, try refreshing token
                        if (
                                response.status === 401 &&
                                localStorage.getItem("refresh_token")
                        ) {
                                try {
                                        token = await this.refreshAccessToken();
                                        headers["Authorization"] =
                                                `Bearer ${token}`;
                                        response = await fetch(url, {
                                                ...options,
                                                headers,
                                        });
                                } catch (refreshError) {
                                        console.error(
                                                "Token refresh failed:",
                                                refreshError,
                                        );
                                        throw refreshError;
                                }
                        }

                        if (!response.ok) {
                                let errorMessage = `API Error: ${response.status} ${response.statusText}`;
                                try {
                                        const errorData = await response.json();
                                        if (errorData.error) {
                                                errorMessage = errorData.error;
                                        } else if (errorData.detail) {
                                                errorMessage = errorData.detail;
                                        }
                                } catch {
                                        // If we can't parse the error response, use the default message
                                }
                                throw new Error(errorMessage);
                        }

                        return await response.json();
                } catch (error) {
                        console.error("API request failed:", error);
                        throw error;
                }
        }

        // Auth endpoints
        async register(username, email, password) {
                return this.request("/auth/register/", {
                        method: "POST",
                        body: JSON.stringify({ username, email, password }),
                });
        }

        async login(email, password) {
                return this.request("/auth/login", {
                        method: "POST",
                        body: JSON.stringify({ email, password }),
                });
        }

        // Player endpoints
        async getPlayers(page = 1, search = "") {
                const params = new URLSearchParams();
                if (page) params.append("page", page);
                if (search) params.append("search", search);
                return this.request(`/players/?${params}`);
        }

        async getPlayer(playerId) {
                return this.request(`/players/${playerId}`);
        }

        // Team endpoints
        async getTeams() {
                return this.request("/teams/");
        }

        async createTeam(name) {
                return this.request("/teams/", {
                        method: "POST",
                        body: JSON.stringify({ name }),
                });
        }

        async addPlayerToTeam(teamId, playerId) {
                return this.request(`/teams/${teamId}/add_player/`, {
                        method: "POST",
                        body: JSON.stringify({ player_id: playerId }),
                });
        }

        async removePlayerFromTeam(teamId, playerId) {
                return this.request(`/teams/${teamId}/remove_player/`, {
                        method: "POST",
                        body: JSON.stringify({ player_id: playerId }),
                });
        }

        async setPlayerActive(teamId, playerId, isActive) {
                return this.request(`/teams/${teamId}/set_player_active/`, {
                        method: "POST",
                        body: JSON.stringify({
                                player_id: playerId,
                                is_active: isActive,
                        }),
                });
        }

        async getTeam(teamId) {
                return this.request(`/teams/${teamId}/`);
        }

        async deleteTeam(teamId) {
                return this.request(`/teams/${teamId}/`, {
                        method: "DELETE",
                });
        }

        // League endpoints
        async getLeagues() {
                return this.request("/leagues/");
        }

        async createLeague(name) {
                return this.request("/leagues/", {
                        method: "POST",
                        body: JSON.stringify({ name }),
                });
        }

        async getLeague(leagueId) {
                return this.request(`/leagues/${leagueId}/`);
        }

        async deleteLeague(leagueId) {
                return this.request(`/leagues/${leagueId}/`, {
                        method: "DELETE",
                });
        }

        async joinLeague(leagueId, teamId) {
                return this.request(`/leagues/${leagueId}/join/`, {
                        method: "POST",
                        body: JSON.stringify({ team_id: teamId }),
                });
        }

        async leaveLeague(leagueId, teamId) {
                return this.request(`/leagues/${leagueId}/leave/`, {
                        method: "POST",
                        body: JSON.stringify({ team_id: teamId }),
                });
        }

        async getLeagueSchedule(leagueId) {
                return this.request(`/leagues/${leagueId}/schedule/`);
        }

        async getLeagueStandings(leagueId) {
                return this.request(`/leagues/${leagueId}/standings/`);
        }

        // Draft endpoints
        async getDraft(leagueId) {
                return this.request(`/drafts/leagues/${leagueId}/draft/`);
        }

        async createDraft(leagueId, totalRounds = 10) {
                return this.request(`/drafts/leagues/${leagueId}/draft/`, {
                        method: "POST",
                        body: JSON.stringify({ total_rounds: totalRounds }),
                });
        }

        async startDraft(leagueId) {
                return this.request(
                        `/drafts/leagues/${leagueId}/draft/start/`,
                        {
                                method: "POST",
                        },
                );
        }

        async makeDraftPick(leagueId, playerId) {
                return this.request(`/drafts/leagues/${leagueId}/draft/pick/`, {
                        method: "POST",
                        body: JSON.stringify({ player_id: playerId }),
                });
        }

        async getDraftPicks(leagueId) {
                return this.request(`/drafts/leagues/${leagueId}/draft/picks/`);
        }

        async getAvailablePlayers(leagueId) {
                return this.request(
                        `/drafts/leagues/${leagueId}/draft/available-players/`,
                );
        }

        // Match endpoints
        async simulateMatch(teamAId, teamBId, seed = null, leagueId = null) {
                const body = {
                        team_a_id: teamAId,
                        team_b_id: teamBId,
                        seed,
                };
                if (leagueId) body.league_id = leagueId;
                return this.request("/matches/simulate/", {
                        method: "POST",
                        body: JSON.stringify(body),
                });
        }
}

export default new APIClient();
