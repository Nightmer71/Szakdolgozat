import logging
import time

import pandas as pd
from nba_api.stats.endpoints import leaguedashplayerstats, playerindex

from .models import Player

logger = logging.getLogger(__name__)

CURRENT_SEASON = "2025-26"


def sync_players_from_nba():
    """
    Fetch all current NBA players and their per-game stats via nba_api and
    upsert them into the Player model.

    Two bulk requests only:
      1. PlayerIndex  → name, position, team  (586 active players)
      2. LeagueDashPlayerStats → PTS/AST/REB/TOV per game

    Safe to call from a background thread – all errors are caught and logged.
    """
    logger.info("NBA sync: starting for season %s", CURRENT_SEASON)

    # ── 1. Roster info (name, position, team) ────────────────────────────
    try:
        roster_df = playerindex.PlayerIndex(
            season=CURRENT_SEASON,
            timeout=60,
        ).get_data_frames()[0]
    except Exception as e:
        logger.error("NBA sync: failed to fetch PlayerIndex: %s", e)
        return

    time.sleep(1)  # respect NBA stats API rate limit

    # ── 2. Per-game stats ─────────────────────────────────────────────────
    try:
        stats_df = leaguedashplayerstats.LeagueDashPlayerStats(
            season=CURRENT_SEASON,
            per_mode_detailed="PerGame",
            timeout=60,
        ).get_data_frames()[0]
    except Exception as e:
        logger.error("NBA sync: failed to fetch LeagueDashPlayerStats: %s", e)
        stats_df = pd.DataFrame()

    # ── 3. Build stats lookup {nba_player_id: stats_dict} ────────────────
    stats_lookup = {}
    for _, row in stats_df.iterrows():
        try:
            pid = int(row["PLAYER_ID"])
            pts = float(row["PTS"]) if pd.notna(row.get("PTS")) else None
            ast = float(row["AST"]) if pd.notna(row.get("AST")) else None
            reb = float(row["REB"]) if pd.notna(row.get("REB")) else None
            tov = float(row["TOV"]) if pd.notna(row.get("TOV")) else 0.0

            eff = pts + reb + ast - tov if None not in (pts, reb, ast) else None

            stats_lookup[pid] = {
                "ppg": pts,
                "apg": ast,
                "rpg": reb,
                "efficiency": eff,
            }
        except (ValueError, TypeError, KeyError):
            continue

    # ── 4. Upsert players ─────────────────────────────────────────────────
    created = updated = 0
    for _, row in roster_df.iterrows():
        try:
            pid = int(row["PERSON_ID"])
            first = str(row.get("PLAYER_FIRST_NAME", "")).strip()
            last = str(row.get("PLAYER_LAST_NAME", "")).strip()
            name = f"{first} {last}".strip()
            if not name:
                continue

            position = str(row.get("POSITION", "")).strip()
            team = str(row.get("TEAM_NAME", "")).strip()
            stats = stats_lookup.get(pid, {})

            _, was_created = Player.objects.update_or_create(
                external_id=str(pid),
                defaults={
                    "name": name,
                    "position": position,
                    "team": team,
                    "metadata": {"stats": stats},
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1
        except Exception as e:
            logger.warning(
                "NBA sync: skipping player %s: %s", row.get("PERSON_ID"), e
            )
            continue

    logger.info("NBA sync complete: %d created, %d updated.", created, updated)
