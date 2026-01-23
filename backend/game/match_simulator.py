import random
from django.db.models import Q
from .models import RosterEntry


def simulate_match(team_a, team_b, seed=None):
    """
    Simulate a basketball match between two teams.
    
    Args:
        team_a: Team object
        team_b: Team object
        seed: Optional seed for deterministic results (useful for testing)
    
    Returns:
        Dictionary with match result including scores and player contributions
    """
    if seed is not None:
        random.seed(seed)
    
    # Get active players from each team's roster
    team_a_players = list(
        RosterEntry.objects.filter(team=team_a, is_active=True)
        .select_related('player')
        .values_list('player', flat=True)
    )
    team_b_players = list(
        RosterEntry.objects.filter(team=team_b, is_active=True)
        .select_related('player')
        .values_list('player', flat=True)
    )
    
    # Basic roster check
    if not team_a_players or not team_b_players:
        return {
            'error': 'Both teams must have active players',
            'team_a_score': 0,
            'team_b_score': 0,
        }
    
    # Simulate match with base scoring
    base_score_team_a = 80
    base_score_team_b = 75
    
    # Add variance based on number of players
    team_a_score = base_score_team_a + len(team_a_players) * 2 + random.randint(-10, 15)
    team_b_score = base_score_team_b + len(team_b_players) * 2 + random.randint(-10, 15)
    
    # Ensure scores are non-negative
    team_a_score = max(0, team_a_score)
    team_b_score = max(0, team_b_score)
    
    # Determine winner
    if team_a_score > team_b_score:
        winner_id = team_a.id
    elif team_b_score > team_a_score:
        winner_id = team_b.id
    else:
        winner_id = None  # Tie
    
    # Generate player contributions (simplified)
    team_a_breakdown = []
    team_b_breakdown = []
    
    for player in RosterEntry.objects.filter(team=team_a, is_active=True).select_related('player'):
        points = random.randint(5, 25)
        team_a_breakdown.append({
            'player_id': player.player.id,
            'player_name': player.player.name,
            'points': points,
            'position': player.player.position,
        })
    
    for player in RosterEntry.objects.filter(team=team_b, is_active=True).select_related('player'):
        points = random.randint(5, 25)
        team_b_breakdown.append({
            'player_id': player.player.id,
            'player_name': player.player.name,
            'points': points,
            'position': player.player.position,
        })
    
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
    }
