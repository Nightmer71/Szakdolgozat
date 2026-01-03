# Month 1: Data Model Design

This document summarizes the initial data model designed for the Fantasy Basketball project and how it maps to upstream NBA data.

## Core Models

- Player

     - external_id (string): id from external NBA API (e.g., `nba_id`)
     - name (string)
     - position (string)
     - team (string)
     - metadata (JSON): raw data or extra fields (e.g., height, weight, basic stats)

- Team

     - name (string)
     - owner (FK -> User)
     - created_at (datetime)

- RosterEntry

     - team (FK -> Team)
     - player (FK -> Player)
     - is_active (bool)
     - added_at (datetime)

- Match
     - team_a (FK -> Team)
     - team_b (FK -> Team)
     - scheduled_at (datetime, optional)
     - created_by (FK -> User)
     - result (JSON): store simulation output (scores, player contributions)

## Relationships and constraints

- A Team has many RosterEntry records (one per player on roster).
- RosterEntry enforces a unique constraint on (team, player).
- Players can be shared across teams (they represent global player entities).

## External NBA API Mapping

- We will sync players from: https://publicapi.dev/nba-data-api
- Map fields:
     - `Player.external_id` <= external player ID (string)
     - `Player.name` <= name
     - `Player.position` <= position
     - `Player.team` <= current team abbreviation
     - `Player.metadata` <= store the raw JSON received for later analysis

## Notes

- Position constraints and roster size limits should be validated at API/serializer level (Month 3).
- We will provide a management command `manage.py sync_players --source=nba` to fetch and upsert Player records.
