// API client for communicating with Django backend
import axios from "axios";

const API_BASE_URL =
        import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const apiClient = axios.create({
        baseURL: API_BASE_URL,
        headers: {
                "Content-Type": "application/json",
        },
});

// Request interceptor to add authorization header
apiClient.interceptors.request.use(
        (config) => {
                const token = sessionStorage.getItem("access_token");
                if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
        },
        (error) => {
                return Promise.reject(error);
        },
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
        (response) => {
                return response;
        },
        async (error) => {
                const originalRequest = error.config;

                if (error.response?.status === 401 && !originalRequest._retry) {
                        originalRequest._retry = true;

                        const refreshToken =
                                sessionStorage.getItem("refresh_token");
                        if (refreshToken) {
                                try {
                                        const response = await axios.post(
                                                `${API_BASE_URL}/auth/token/refresh/`,
                                                {
                                                        refresh: refreshToken,
                                                },
                                        );

                                        const newAccessToken =
                                                response.data.access;
                                        sessionStorage.setItem(
                                                "access_token",
                                                newAccessToken,
                                        );

                                        // Update the authorization header for the original request
                                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                                        // Retry the original request
                                        return apiClient(originalRequest);
                                } catch (refreshError) {
                                        // Refresh failed, clear tokens
                                        sessionStorage.removeItem("access_token");
                                        sessionStorage.removeItem(
                                                "refresh_token",
                                        );
                                        return Promise.reject(refreshError);
                                }
                        }
                }

                return Promise.reject(error);
        },
);

class APIClient {
        // Auth endpoints
        async register(username, email, password) {
                const response = await apiClient.post("/auth/register/", {
                        username,
                        email,
                        password,
                });
                return response.data;
        }

        async login(username, password) {
                const response = await apiClient.post("/auth/token/", {
                        username,
                        password,
                });
                return response.data;
        }

        async request(url, options = {}) {
                const { method = "GET", body, ...rest } = options;
                const config = {
                        method,
                        url,
                        ...rest,
                };
                if (body) config.data = body;
                const response = await apiClient.request(config);
                return response.data;
        }

        // Player endpoints
        async getPlayers(page = 1, search = "") {
                const params = { page, search };
                const response = await apiClient.get("/players/", { params });
                return response.data;
        }

        async getPlayer(playerId) {
                const response = await apiClient.get(`/players/${playerId}`);
                return response.data;
        }

        // Team endpoints
        async getTeams() {
                const response = await apiClient.get("/teams/");
                return response.data;
        }

        async createTeam(name) {
                const response = await apiClient.post("/teams/", { name });
                return response.data;
        }

        async addPlayerToTeam(teamId, playerId) {
                const response = await apiClient.post(
                        `/teams/${teamId}/add_player/`,
                        { player_id: playerId },
                );
                return response.data;
        }

        async removePlayerFromTeam(teamId, playerId) {
                const response = await apiClient.post(
                        `/teams/${teamId}/remove_player/`,
                        { player_id: playerId },
                );
                return response.data;
        }

        async setPlayerActive(teamId, playerId, isActive) {
                const response = await apiClient.post(
                        `/teams/${teamId}/set_player_active/`,
                        { player_id: playerId, is_active: isActive },
                );
                return response.data;
        }

        async getTeam(teamId) {
                const response = await apiClient.get(`/teams/${teamId}/`);
                return response.data;
        }

        async deleteTeam(teamId) {
                const response = await apiClient.delete(`/teams/${teamId}/`);
                return response.data;
        }

        // League endpoints
        async getLeagues() {
                const response = await apiClient.get("/leagues/");
                return response.data;
        }

        async createLeague(name) {
                const response = await apiClient.post("/leagues/", { name });
                return response.data;
        }

        async getLeague(leagueId) {
                const response = await apiClient.get(`/leagues/${leagueId}/`);
                return response.data;
        }

        async deleteLeague(leagueId) {
                const response = await apiClient.delete(
                        `/leagues/${leagueId}/`,
                );
                return response.data;
        }

        async joinLeague(leagueId, teamId) {
                const response = await apiClient.post(
                        `/leagues/${leagueId}/join/`,
                        { team_id: teamId },
                );
                return response.data;
        }

        async leaveLeague(leagueId, teamId) {
                const response = await apiClient.post(
                        `/leagues/${leagueId}/leave/`,
                        { team_id: teamId },
                );
                return response.data;
        }

        async getLeagueSchedule(leagueId) {
                const response = await apiClient.get(
                        `/leagues/${leagueId}/schedule/`,
                );
                return response.data;
        }

        async getLeagueStandings(leagueId) {
                const response = await apiClient.get(
                        `/leagues/${leagueId}/standings/`,
                );
                return response.data;
        }

        // Draft endpoints
        async getDraft(leagueId) {
                const response = await apiClient.get(
                        `/drafts/leagues/${leagueId}/draft/`,
                );
                return response.data;
        }

        async createDraft(leagueId, totalRounds = 10) {
                const response = await apiClient.post(
                        `/drafts/leagues/${leagueId}/draft/`,
                        { total_rounds: totalRounds },
                );
                return response.data;
        }

        async startDraft(leagueId) {
                const response = await apiClient.post(
                        `/drafts/leagues/${leagueId}/draft/start/`,
                );
                return response.data;
        }

        async makeDraftPick(leagueId, playerId) {
                const response = await apiClient.post(
                        `/drafts/leagues/${leagueId}/draft/pick/`,
                        { player_id: playerId },
                );
                return response.data;
        }

        async getDraftPicks(leagueId) {
                const response = await apiClient.get(
                        `/drafts/leagues/${leagueId}/draft/picks/`,
                );
                return response.data;
        }

        async getAvailablePlayers(leagueId) {
                const response = await apiClient.get(
                        `/drafts/leagues/${leagueId}/draft/available-players/`,
                );
                return response.data;
        }

        // Match endpoints
        async simulateMatch(teamAId, teamBId, seed = null, leagueId = null) {
                const data = {
                        team_a_id: teamAId,
                        team_b_id: teamBId,
                        seed,
                };
                if (leagueId) data.league_id = leagueId;
                const response = await apiClient.post(
                        "/matches/simulate/",
                        data,
                );
                return response.data;
        }
}

export default new APIClient();
