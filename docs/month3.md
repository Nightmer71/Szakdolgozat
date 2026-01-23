# Month 3: Backend Implementation - API & Authentication

This document describes the Month 3 deliverables focusing on backend API implementation with DRF, serializers, viewsets, and JWT authentication.

## Overview

Month 3 focuses on implementing the core backend API endpoints using Django REST Framework. This includes:

- DRF Serializers for all models
- ViewSets and generic views for CRUD operations
- JWT token-based authentication
- Match simulation algorithm
- Player sync from external NBA API

## Deliverables Completed ✅

### 1. Django REST Framework Integration ✅

- Added `djangorestframework-simplejwt` to requirements.txt
- Configured JWT authentication in Django settings
- Updated INSTALLED_APPS with `rest_framework_simplejwt`
- Set JWT token lifetime (access: 1 hour, refresh: 7 days)
- Configured REST_FRAMEWORK authentication classes to use JWT

### 2. DRF Serializers (`backend/game/serializers.py`) ✅

- **UserSerializer**: User model serialization
- **PlayerSerializer**: Player model (CRUD operations)
- **RosterEntrySerializer**: Team roster entries with nested player data
- **TeamSerializer**: Team listing with roster info
- **TeamDetailSerializer**: Detailed team view
- **MatchSerializer**: Match records with team data
- **MatchSimulationSerializer**: Request validation for match simulation

### 3. DRF ViewSets (`backend/game/views.py`) ✅

#### PlayerViewSet (Read-only)

- **GET /api/players/** - List all players (paginated)
- **GET /api/players/{id}/** - Retrieve player details
- Supports filtering:
     - `?search=name` - Search by player name
     - `?position=G` - Filter by position
     - `?team=Lakers` - Filter by team
- Permissions: AllowAny (public access)

#### TeamViewSet (Full CRUD)

- **GET /api/teams/** - List current user's teams
- **POST /api/teams/** - Create new team (auto-sets owner)
- **GET /api/teams/{id}/** - Retrieve team with roster
- **PUT /api/teams/{id}/** - Update team
- **DELETE /api/teams/{id}/** - Delete team
- Custom actions:
     - **POST /api/teams/{id}/add_player/** - Add player to roster
     - **POST /api/teams/{id}/remove_player/** - Remove player from roster
- Permissions: IsAuthenticated (only user's own teams)

#### MatchViewSet (Full CRUD + Simulation)

- **GET /api/matches/** - List user's matches
- **POST /api/matches/** - Create match record
- **GET /api/matches/{id}/** - Get match details
- Custom action:
     - **POST /api/matches/simulate/** - Simulate a match between two teams
          - Request body: `{ "team_a_id": 1, "team_b_id": 2, "seed": null }`
          - Returns: Match object with simulation result
- Permissions: IsAuthenticated

#### RegisterView

- **POST /api/auth/register/** - User registration
     - Request body: `{ "username": "...", "email": "...", "password": "..." }`
     - Returns: User object on success
     - Public access (AllowAny)

### 4. Authentication Endpoints ✅

- **POST /api/auth/token/** - Obtain JWT tokens (SimpleJWT default)
     - Request: `{ "username": "...", "password": "..." }`
     - Returns: `{ "access": "...", "refresh": "..." }`
- **POST /api/auth/token/refresh/** - Refresh access token
     - Request: `{ "refresh": "..." }`
     - Returns: `{ "access": "..." }`
- **POST /api/auth/register/** - Register new user

### 5. Match Simulation Algorithm (`backend/game/match_simulator.py`) ✅

- Deterministic simulation with optional seed (for testing)
- Gets active players from both teams
- Calculates base score + variance based on roster size
- Generates per-player point contributions
- Returns detailed result with:
     - Team scores
     - Player-by-player breakdown
     - Winner determination
     - JSON format for storage in Match.result field

### 6. Player Sync Command Implementation ✅

- **Command**: `python manage.py sync_players --source=nba [--limit=N]`
- Features:
     - Fetches teams from https://publicapi.dev/api/nba/teams
     - Fetches players for each team
     - Upserts Player records to avoid duplicates
     - Stores full API response in `metadata` JSON field
     - Supports limiting sync (useful for testing)
     - Progress output with styling
     - Error handling and reporting

### 7. Updated Django URLs (`backend/backend/urls.py`) ✅

Router configuration:

```
/api/players/                    (GET - list)
/api/players/{id}/               (GET - detail)
/api/teams/                      (GET list, POST create)
/api/teams/{id}/                 (GET, PUT, DELETE)
/api/teams/{id}/add_player/      (POST)
/api/teams/{id}/remove_player/   (POST)
/api/matches/                    (GET list, POST create)
/api/matches/{id}/               (GET, PUT, DELETE)
/api/matches/simulate/           (POST)
/api/auth/token/                 (POST - login)
/api/auth/token/refresh/         (POST - refresh)
/api/auth/register/              (POST - register)
/api-auth/                       (DRF browsable API auth)
```

## Updated Files

### backend/requirements.txt

- Added `djangorestframework-simplejwt==5.3.2`
- Added `requests==2.31.0` (for API calls)

### backend/backend/settings.py

- Added JWT configuration (token lifetime, algorithm)
- Updated REST_FRAMEWORK authentication to use JWTAuthentication
- Configured default permission classes

### backend/game/serializers.py (new)

- Complete serializer hierarchy for all models

### backend/game/views.py

- PlayerViewSet, TeamViewSet, MatchViewSet, RegisterView

### backend/game/match_simulator.py (new)

- Match simulation algorithm

### backend/game/management/commands/sync_players.py (updated)

- Full implementation of NBA API sync

### backend/backend/urls.py (updated)

- Router registration for all viewsets
- JWT token endpoints
- Registration endpoint

## Testing the API (Post-Implementation)

### 1. Register a user

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"testpass123"}'
```

### 2. Obtain tokens

```bash
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
```

### 3. List players

```bash
curl http://localhost:8000/api/players/
```

### 4. Create team (with token)

```bash
curl -X POST http://localhost:8000/api/teams/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Team"}'
```

### 5. Sync NBA players

```bash
docker-compose exec backend python manage.py sync_players --source=nba --limit=5
```

### 6. Simulate match

```bash
curl -X POST http://localhost:8000/api/matches/simulate/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"team_a_id":1,"team_b_id":2}'
```

## Architecture Notes

### Permissions Model

- **Public endpoints**: Players (read-only)
- **Authenticated endpoints**: Teams, Matches, Auth
- **User-scoped**: Teams and Matches filtered by current user

### Pagination

- Default page size: 20 items
- Uses DRF's PageNumberPagination

### Error Handling

- Consistent JSON error responses
- Proper HTTP status codes (201 Created, 400 Bad Request, 404 Not Found, etc.)
- Validation errors include field-level messages

## Next Steps (Month 4)

Month 4 focuses on Frontend implementation:

- React components for registration/login
- Player listing page with filters
- Team management UI (create, add players)
- Match simulation UI
- State management (Context or Redux)
- Integration with backend API via `api.js` client

## Notes & Caveats

1. Match simulation uses a simplified algorithm suitable for MVP. Month 5+ can add:
      - Player stats integration
      - Advanced position-based scoring
      - Historical data consideration

2. Player sync API may have rate limits. Consider adding:
      - Caching
      - Pagination for large datasets
      - Async task queue (Celery) for background sync

3. JWT tokens are stored in localStorage on frontend (consider HttpOnly cookies for production).

4. Tests not yet implemented (scheduled for Month 7).
