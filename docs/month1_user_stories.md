# Month 1: Requirements — User Stories & Acceptance Criteria

This file captures the Month 1 deliverables extracted from `SzakdogaTerv.docx` and translates them into concise user stories and acceptance criteria for implementation.

## Context

Project: Fantasy basketball web application
Primary tech: React (frontend), Django + Django REST Framework (backend), PostgreSQL
External data source: https://publicapi.dev/nba-data-api (player/stats data)

---

## Epic: User accounts & onboarding

- As a visitor, I want to register an account so I can create and manage teams.
     - Acceptance: Can POST `/api/auth/register` with email/password and receive 201 and a user object.
     - Acceptance: Validation errors return 400 with field-level messages.
- As a user, I want to log in so I can access protected endpoints.
     - Acceptance: POST `/api/auth/login` returns JWT access token and refresh token on success.

## Epic: Team management

- As a user, I want to create a team so I can collect players and compete.
     - Acceptance: POST `/api/teams/` creates a team owned by the current user; required fields: `name`.
     - Acceptance: GET `/api/teams/` lists teams for the current user.
- As a user, I want to add players to my team so I can build my roster.
     - Acceptance: POST `/api/teams/{team_id}/players/` adds an existing player (by player ID) to team roster.
     - Acceptance: Basic constraints enforced (e.g., roster size limit, position constraints if applicable).

## Epic: Player catalog

- As a user, I want to view available players so I can select them for my team.
     - Acceptance: GET `/api/players/` supports pagination and optional filters (team, position, name search).
     - Acceptance: Player records include source attribution (if fetched from external NBA API).

## Epic: Match simulation

- As a user, I want to simulate a match between two teams so I can determine a result.
     - Acceptance: POST `/api/matches/simulate/` with two team IDs returns simulated scores, per-player contributions, and a winner.
     - Acceptance: Simulation accepts a `seed` param for deterministic results (useful for tests).

## Non-functional & Integration

- As a developer, I want the backend to use DRF and return JSON API shaped responses.
- As a developer, I want the player data to be synchronizable from the external NBA API (configurable cron / management command).
     - Acceptance: Document integration points and which fields we map from the external API (e.g., player id, name, position, team, basic stats).

---

## Notes & Next steps

- The API spec will formalize routes above in OpenAPI format (see `backend/docs/openapi.yaml`).
- The data model will reflect Users (use Django auth or custom user), Player, Team, TeamMembership (roster), Match, MatchResult.
- We'll add example cURL requests and acceptance tests for each story in Month 3 when endpoints are implemented.

_If any of these stories need to be adjusted or expanded, tell me which ones to prioritize or change._
