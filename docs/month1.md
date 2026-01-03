# Month 1 Deliverables — Summary

Status: Completed ✅

## What I did

- Read `SzakdogaTerv.docx` and extracted Month 1 requirements (user stories, API spec, data model).
- Created `docs/month1_user_stories.md` with concise user stories and acceptance criteria for registration, team management, player catalog, and match simulation.
- Drafted an OpenAPI skeleton at `backend/docs/openapi.yaml` describing endpoints and schemas.
- Designed the data model and implemented a new Django app `game` with models:
     - `Player`, `Team`, `RosterEntry`, `Match` (see `backend/game/models.py`)
- Added a skeleton management command to sync players from the external NBA API: `manage.py sync_players --source=nba` (see `backend/game/management/commands/sync_players.py`).
- Added `docs/month1_data_model.md` describing model fields and mapping to external API.

## Files added/changed

- docs/month1_user_stories.md (new)
- backend/docs/openapi.yaml (new)
- docs/month1_data_model.md (new)
- backend/game/ (new Django app with models & admin + management command)
- backend/backend/settings.py (registered `game.apps.GameConfig`)
- docs/month1.md (this summary)

## Notes & Next steps

- Implementation of API endpoints, serializers, and tests will be Month 3 tasks per the project schedule.
- Planned next technical tasks:
     - Implement DRF serializers and viewsets for Player/Team/Match.
     - Integrate JWT authentication (e.g., SimpleJWT).
     - Implement `sync_players` using the NBA public API and add a unit test for the import.
     - Add CI job to run Django tests and linters.

If you'd like, I can:

- Expand the OpenAPI spec with example request/response payloads and status codes.
- Implement the first serializers and viewsets for registration and teams (quick MVP endpoints).

Please tell me which of these you'd like me to prioritize next.
