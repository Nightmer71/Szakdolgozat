// API client for communicating with Django backend
const API_BASE_URL =
        import.meta.env.VITE_API_URL || "http://localhost:8000/api";

class APIClient {
        constructor(baseURL = API_BASE_URL) {
                this.baseURL = baseURL;
        }

        async request(endpoint, options = {}) {
                const url = `${this.baseURL}${endpoint}`;
                const token = localStorage.getItem("access_token");

                const headers = {
                        "Content-Type": "application/json",
                        ...options.headers,
                };

                if (token) {
                        headers["Authorization"] = `Bearer ${token}`;
                }

                try {
                        const response = await fetch(url, {
                                ...options,
                                headers,
                        });

                        if (!response.ok) {
                                throw new Error(
                                        `API Error: ${response.status} ${response.statusText}`,
                                );
                        }

                        return await response.json();
                } catch (error) {
                        console.error("API request failed:", error);
                        throw error;
                }
        }

        // Auth endpoints
        async register(email, password) {
                return this.request("/auth/register", {
                        method: "POST",
                        body: JSON.stringify({ email, password }),
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

        async getTeam(teamId) {
                return this.request(`/teams/${teamId}/`);
        }

        // Match endpoints
        async simulateMatch(teamAId, teamBId, seed = null) {
                return this.request("/matches/simulate/", {
                        method: "POST",
                        body: JSON.stringify({
                                team_a_id: teamAId,
                                team_b_id: teamBId,
                                seed,
                        }),
                });
        }
}

export default new APIClient();
