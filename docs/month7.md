# Month 7: Draft System for Leagues

## Overview

Month 7 introduces a **draft system** to the league functionality, allowing league owners to organize player drafts where teams can select players in a structured order. This adds competitive depth to the league experience and ensures fair player distribution.

## Deliverables Implemented ✅

### 1. Draft Models ✅

#### Draft Model

- `league` – foreign key to League
- `status` – enum: 'pending', 'active', 'completed'
- `current_round` – current draft round
- `current_pick` – current pick number
- `total_rounds` – number of rounds in draft
- `pick_order` – JSON field storing team pick order per round
- `created_at` – timestamp

#### DraftPick Model

- `draft` – foreign key to Draft
- `team` – foreign key to Team (the team making the pick)
- `player` – foreign key to Player (selected player)
- `round_number` – which round this pick was in
- `pick_number` – overall pick number
- `pick_time` – timestamp when pick was made

### 2. Backend API Endpoints ✅

#### Draft Management

- **POST** `/api/drafts/leagues/{id}/draft/` – Create a new draft for the league (owner only)
- **GET** `/api/drafts/leagues/{id}/draft/` – Get current draft status
- **POST** `/api/drafts/leagues/{id}/draft/start/` – Start the draft (owner only)
- **POST** `/api/drafts/leagues/{id}/draft/pick/` – Make a player pick (current team's turn only)

#### Draft Data

- **GET** `/api/drafts/leagues/{id}/draft/picks/` – Get all picks made in the draft
- **GET** `/api/drafts/leagues/{id}/draft/available-players/` – Get players available for draft

### 3. Frontend Components ✅

#### DraftPage Component

- **DraftLobby**: Waiting area before draft starts
- **DraftBoard**: Live draft interface showing:
     - Current pick information
     - Available players list
     - Draft order and progress
     - Team rosters being built
- **DraftHistory**: Completed picks log

#### Enhanced LeagueDetailPage

- Add "Draft" section with link to draft page
- Shows draft status and navigation

### 4. Draft Logic ✅

#### Pick Order

- Snake draft format: Round 1: Team1 → Team2 → Team3 → Team2 → Team1, etc.
- Configurable number of rounds (default: 10)

#### Draft Flow

1. League owner creates draft
2. Teams join draft queue
3. Owner starts draft
4. Teams take turns picking players
5. Draft completes when all rounds finished
6. Teams get their drafted rosters

#### Validation

- Only current team's turn can pick
- Player must be available (not already drafted)
- Team cannot pick players they already own

### 5. Testing ✅

#### Backend Tests

- Draft creation and validation
- Pick order logic
- Permission checks
- All tests passing

#### Frontend Build

- Components compile successfully
- Navigation integrated

## Technical Implementation

### Backend Changes

- New models: `Draft`, `DraftPick`
- New serializers: `DraftSerializer`, `DraftPickSerializer`
- New views: `DraftViewSet` with custom actions
- Database migrations applied
- Full API integration

### Frontend Changes

- New component: `DraftPage.jsx`
- New styles: `Draft.css`
- Enhanced `api.js` with draft endpoints
- URL-based navigation for draft pages
- Integrated with league system

### Database Migrations

- Migration `0003_draft_draftpick.py` created and applied
- Tables created successfully

## Acceptance Criteria ✅

- [x] League owners can create and start drafts
- [x] Teams can participate in live drafts with turn-based picking
- [x] Snake draft format with configurable rounds
- [x] Player availability and validation
- [x] Draft results integrated with team rosters
- [x] Comprehensive test coverage
- [x] Frontend navigation and UI components

## Future Enhancements (Month 8+)

- Real-time WebSocket updates for live draft experience
- Auction draft format
- Trade system between teams
- Draft lottery system
- Historical draft data and analytics
- Mobile optimization for draft interface</content>
  <parameter name="filePath">/home/toty/SSD/Egyetem/Szakdoga/docs/month7.md
