# Month 6: League System & Scheduling

## Overview

Month 6 expands the fantasy basketball application with a **league system** to enable structured competitions. Users can now organize teams into leagues, generate schedules, and track standings across multiple teams.

## Deliverables Implemented ✅

### 1. League Models ✅

#### League Model

- `name` – league name
- `owner` – user who created the league
- `created_at` – timestamp
- Stores league metadata for competitions

#### LeagueMembership Model

- `league` – foreign key to League
- `team` – foreign key to Team
- `joined_at` – timestamp when team joined
- Unique constraint on (league, team) to prevent duplicate memberships

#### Match Model Enhancement ✅

- Added optional `league` foreign key to Match
- Allows matches to be associated with a league for tournament organization

### 2. API Endpoints ✅

#### League Management

- **POST** `/api/leagues/` – Create a new league (authenticated users)
- **GET** `/api/leagues/` – List leagues the user owns or has teams in
- **GET** `/api/leagues/{id}/` – Retrieve league details with members and standings
- **PUT/PATCH** `/api/leagues/{id}/` – Update league (owner only)

#### League Membership Actions ✅

- **POST** `/api/leagues/{id}/join/` – Add user's team to a league
     - Accepts `team_id` in request body
     - Validates team ownership
     - Returns 201 on success, 200 if already member
- **POST** `/api/leagues/{id}/leave/` – Remove user's team from a league
     - Accepts `team_id` in request body
     - Validates ownership before removal
     - Returns 204 on success

#### Schedule & Standings ✅

- **GET** `/api/leagues/{id}/schedule/` – Fetch all matches in the league
     - Returns match list with team details
- **GET** `/api/leagues/{id}/standings/` – Fetch league standings
     - Computed from match results (team_a_score, team_b_score)
     - Each team shows: wins, losses, points_for, points_against
     - Sorted by wins descending

### 3. Standings Computation ✅

The `LeagueSerializer` includes a `get_standings()` method that:

- Iterates through all matches with results in the league
- Accumulates wins/losses and point differentials per team
- Returns standings sorted by wins (descending)
- Computes points_for and points_against from match results

### 4. Schedule Generation Command ✅

Management command `generate_schedule` creates matches for a league:

- Generates simple round-robin: unique pairs of teams
- Optional `--reverse` flag to add reverse fixtures (B vs A after A vs B)
- Creates match records ready to be simulated

Example:

```bash
python manage.py generate_schedule <league_id>
python manage.py generate_schedule <league_id> --reverse
```

### 5. Serializers ✅

#### LeagueSerializer

- Includes nested `members` (list of teams in league via LeagueMembership)
- Includes computed `standings` field
- Read-only fields: id, owner, created_at, members, standings
- Owner automatically set on creation

#### LeagueMembershipSerializer

- Nested `team` with full team details
- `team_id` for write operations

#### MatchSerializer Enhancement

- Added optional `league` foreign key
- Accepts `league_id` on creation for league-scoped matches

### 6. Backend Tests ✅

#### `test_league.py`

- **test_create_and_join_league** – Validates league creation and join/leave workflows
- **test_standings_reflect_results** – Verifies standings computation with multiple match results

Tests confirm:

- CRUD operations on leagues and memberships
- Proper ownership and permission checks
- Accurate standings calculations

### 7. Permission & Authorization

All league endpoints require authentication. Users can:

- View/manage only their own leagues
- Add/remove only their own teams from leagues
- See standings for any league their team belongs to

---

## API Usage Examples

### Create a league

```bash
curl -X POST http://localhost:8000/api/leagues/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Pro Fantasy League"}'
```

### Join a team to league

```bash
curl -X POST http://localhost:8000/api/leagues/1/join/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"team_id": 5}'
```

### Generate schedule

```bash
python manage.py generate_schedule 1 --reverse
```

### Fetch standings

```bash
curl http://localhost:8000/api/leagues/1/standings/ \
  -H "Authorization: Bearer <token>"
```

---

## Frontend Enhancements (Next Steps)

Upcoming additions:

- League list and detail pages
- Create league form
- Join league UI
- Standings table/chart display
- Match scheduling interface
