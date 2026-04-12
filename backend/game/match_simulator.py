import random
from django.db.models import Q
from .models import RosterEntry


def _extract_player_skill(player):
    """
    The mapping combines available stat fields into a single `skill` value
    using a simple weighted formula:
      skill = base + w_ppg * norm(ppg) + w_eff * norm(eff) + w_usage * norm(usage)
    """
    metadata = getattr(player, 'metadata', {}) or {}
    stats = metadata.get('stats') or metadata.get('full_data') or {}

    def _get_num(keys):
        for key in keys:
            try:
                val = stats.get(key)
                if isinstance(val, (int, float)):
                    return float(val)
            except Exception:
                continue
        nested = stats.get('averages') or stats.get('average') or {}
        if isinstance(nested, dict):
            for key in keys:
                try:
                    val = nested.get(key)
                    if isinstance(val, (int, float)):
                        return float(val)
                except Exception:
                    continue
        return None

    ppg = _get_num(('ppg', 'points_per_game', 'pointsPerGame', 'points'))
    eff = _get_num(('efficiency', 'eff', 'rating', 'player_efficiency'))
    usage = _get_num(('usage', 'usage_rate', 'usagePercentage'))

    def norm_ppg(v):
        return max(0.0, min(1.0, v / 30.0)) if v is not None else 0.0

    def norm_eff(v):
        return max(0.0, min(1.0, (v - 5.0) / 25.0)) if v is not None else 0.0

    def norm_usage(v):
        return max(0.0, min(1.0, v / 35.0)) if v is not None else 0.0

    w_ppg = 0.6
    w_eff = 0.3
    w_usage = 0.1

    base = 0.7

    score = base + (w_ppg * norm_ppg(ppg)) + (w_eff * norm_eff(eff)) + (w_usage * norm_usage(usage))

    if ppg is None and eff is None and usage is None:
        return 0.8 + random.random() * 0.6

    return max(0.5, min(2.5, 0.8 + score * 1.6))


def simulate_match(team_a, team_b, seed=None, minutes=48):
    """
    Simulate a basketball match between two teams with a minute-by-minute timeline.
    Returns: Dictionary with match result including final scores, per-player totals and a timeline of events.
    """
    if seed is not None:
        random.seed(seed)

    team_a_entries = list(RosterEntry.objects.filter(team=team_a, is_active=True).select_related('player'))
    team_b_entries = list(RosterEntry.objects.filter(team=team_b, is_active=True).select_related('player'))

    if not team_a_entries or not team_b_entries:
        return {
            'error': 'Both teams must have active players',
            'team_a_score': 0,
            'team_b_score': 0,
            'timeline': [],
        }

    team_a_players = []
    team_b_players = []

    for entry in team_a_entries:
        player = entry.player
        skill = _extract_player_skill(player)
        team_a_players.append({'id': player.id, 'name': player.name, 'skill': skill, 'position': player.position})

    for entry in team_b_entries:
        player = entry.player
        skill = _extract_player_skill(player)
        team_b_players.append({'id': player.id, 'name': player.name, 'skill': skill, 'position': player.position})

    team_a_total_skill = sum(p['skill'] for p in team_a_players)
    team_b_total_skill = sum(p['skill'] for p in team_b_players)

    team_a_score = 0
    team_b_score = 0
    timeline = []
    player_totals = {p['id']: 0 for p in team_a_players + team_b_players}

    for minute in range(1, minutes + 1):
        events_this_minute = max(0, int(random.gauss(1, 0.9)))
        for _ in range(events_this_minute):
            total = team_a_total_skill + team_b_total_skill
            if total <= 0:
                scoring_team = 'a' if random.random() < 0.5 else 'b'
            else:
                if random.random() < (team_a_total_skill / total):
                    scoring_team = 'a'
                else:
                    scoring_team = 'b'

            if scoring_team == 'a':
                players = team_a_players
            else:
                players = team_b_players

            weights = [p['skill'] for p in players]
            chosen = random.choices(players, weights=weights, k=1)[0]

            rnd = random.random()
            if rnd < 0.05:
                points = 1
            elif rnd < 0.3:
                points = 3
            else:
                points = 2

            event = {
                'minute': minute,
                'team_id': team_a.id if scoring_team == 'a' else team_b.id,
                'team_name': team_a.name if scoring_team == 'a' else team_b.name,
                'player_id': chosen['id'],
                'player_name': chosen['name'],
                'points': points,
                'position': chosen.get('position'),
            }
            timeline.append(event)

            if scoring_team == 'a':
                team_a_score += points
            else:
                team_b_score += points
            player_totals[chosen['id']] += points

    if team_a_score > team_b_score:
        winner_id = team_a.id
    elif team_b_score > team_a_score:
        winner_id = team_b.id
    else:
        winner_id = None

    team_a_breakdown = [
        {
            'player_id': p['id'],
            'player_name': p['name'],
            'points': player_totals.get(p['id'], 0),
            'position': p.get('position'),
            'skill': p.get('skill'),
        }
        for p in team_a_players
    ]
    team_b_breakdown = [
        {
            'player_id': p['id'],
            'player_name': p['name'],
            'points': player_totals.get(p['id'], 0),
            'position': p.get('position'),
            'skill': p.get('skill'),
        }
        for p in team_b_players
    ]

    return {
        'team_a_id': team_a.id,
        'team_a_name': team_a.name,
        'team_a_score': team_a_score,
        'team_a_players': team_a_breakdown,
        'team_b_id': team_b.id,
        'team_b_name': team_b.name,
        'team_b_score': team_b_score,
        'team_b_players': team_b_breakdown,
        'winner_id': winner_id,
        'timeline': timeline,
    }
