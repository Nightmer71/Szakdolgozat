from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Player, Team, RosterEntry, Match, League, LeagueMembership, Draft, DraftPick


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ['id', 'external_id', 'name', 'position', 'team', 'metadata']
        read_only_fields = ['id']


class RosterEntrySerializer(serializers.ModelSerializer):
    player = PlayerSerializer(read_only=True)
    player_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = RosterEntry
        fields = ['id', 'player', 'player_id', 'is_active', 'added_at']
        read_only_fields = ['id', 'added_at']


class TeamSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    roster = RosterEntrySerializer(many=True, read_only=True)

    class Meta:
        model = Team
        fields = ['id', 'name', 'owner', 'roster', 'created_at']
        read_only_fields = ['id', 'owner', 'created_at']


class TeamDetailSerializer(serializers.ModelSerializer):
    """Detailed team view with full roster information"""
    owner = UserSerializer(read_only=True)
    roster = RosterEntrySerializer(many=True, read_only=True)

    class Meta:
        model = Team
        fields = ['id', 'name', 'owner', 'roster', 'created_at']
        read_only_fields = ['id', 'owner', 'created_at']


class LeagueMembershipSerializer(serializers.ModelSerializer):
    team = TeamSerializer(read_only=True)
    team_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = LeagueMembership
        fields = ['id', 'team', 'team_id', 'joined_at']
        read_only_fields = ['id', 'joined_at']


class LeagueSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    members = LeagueMembershipSerializer(many=True, read_only=True, source='memberships')
    standings = serializers.SerializerMethodField()

    class Meta:
        model = League
        fields = ['id', 'name', 'owner', 'created_at', 'members', 'standings']
        read_only_fields = ['id', 'owner', 'created_at', 'members', 'standings']

    def get_standings(self, obj):
        """Compute simple standings based on finished match results."""
        # Prepare initial stats per team
        stats = {}
        for membership in obj.memberships.select_related('team'):
            t = membership.team
            stats[t.id] = {
                'team_id': t.id,
                'team_name': t.name,
                'wins': 0,
                'losses': 0,
                'points_for': 0,
                'points_against': 0,
            }
        # iterate over matches with results
        for match in obj.matches.filter(result__isnull=False):
            res = match.result or {}
            a_score = res.get('team_a_score', 0)
            b_score = res.get('team_b_score', 0)
            # update points
            if match.team_a.id in stats:
                stats[match.team_a.id]['points_for'] += a_score
                stats[match.team_a.id]['points_against'] += b_score
            if match.team_b.id in stats:
                stats[match.team_b.id]['points_for'] += b_score
                stats[match.team_b.id]['points_against'] += a_score
            # update win/loss
            if a_score > b_score:
                if match.team_a.id in stats:
                    stats[match.team_a.id]['wins'] += 1
                if match.team_b.id in stats:
                    stats[match.team_b.id]['losses'] += 1
            elif b_score > a_score:
                if match.team_b.id in stats:
                    stats[match.team_b.id]['wins'] += 1
                if match.team_a.id in stats:
                    stats[match.team_a.id]['losses'] += 1
        # return sorted list by wins descending
        return sorted(stats.values(), key=lambda x: x['wins'], reverse=True)


class MatchSerializer(serializers.ModelSerializer):
    league = LeagueSerializer(read_only=True)
    league_id = serializers.IntegerField(write_only=True, required=False)
    team_a = TeamSerializer(read_only=True)
    team_b = TeamSerializer(read_only=True)
    team_a_id = serializers.IntegerField(write_only=True)
    team_b_id = serializers.IntegerField(write_only=True)
    created_by = UserSerializer(read_only=True)

    # computed summary of the simulation result for quick analysis
    summary = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = [
            'id',
            'team_a',
            'team_b',
            'team_a_id',
            'team_b_id',
            'scheduled_at',
            'created_by',
            'created_at',
            'result',
            'summary',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'result', 'summary']

    def get_summary(self, obj):
        """Derive analytic fields from the raw result JSON.

        The summary includes top scorers per team and a quarter-by-quarter score
        breakdown.  This keeps the frontend lightweight by avoiding repeated
        computations.
        """
        result = obj.result or {}
        timeline = result.get('timeline', [])
        # accumulate points per player for each team
        team_a_scores = {}
        team_b_scores = {}
        for ev in timeline:
            if ev.get('team_id') == obj.team_a.id:
                team_a_scores[ev['player_id']] = team_a_scores.get(ev['player_id'], 0) + ev.get('points', 0)
            else:
                team_b_scores[ev['player_id']] = team_b_scores.get(ev['player_id'], 0) + ev.get('points', 0)
        def top_list(score_dict):
            # convert to list of {player_id, points} sorted descending
            return sorted(
                [{'player_id': pid, 'points': pts} for pid, pts in score_dict.items()],
                key=lambda x: x['points'],
                reverse=True,
            )
        quarters = []
        # ensure we know number of minutes (default 48)
        max_min = max((ev.get('minute', 0) for ev in timeline), default=0)
        mins_per_q = 12
        num_q = (max_min + mins_per_q - 1) // mins_per_q if max_min else 4
        for q in range(num_q):
            start = q * mins_per_q + 1
            end = (q + 1) * mins_per_q
            qa = qb = 0
            for ev in timeline:
                m = ev.get('minute', 0)
                if start <= m <= end:
                    if ev.get('team_id') == obj.team_a.id:
                        qa += ev.get('points', 0)
                    else:
                        qb += ev.get('points', 0)
            quarters.append({'team_a': qa, 'team_b': qb})
        return {'top_scorers': {'team_a': top_list(team_a_scores), 'team_b': top_list(team_b_scores)}, 'quarters': quarters}


class MatchSimulationSerializer(serializers.Serializer):
    """Serializer for match simulation requests"""
    team_a_id = serializers.IntegerField()
    team_b_id = serializers.IntegerField()
    seed = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, data):
        if data['team_a_id'] == data['team_b_id']:
            raise serializers.ValidationError("Teams must be different.")
        return data


class DraftSerializer(serializers.ModelSerializer):
    """Serializer for draft management"""
    league = LeagueSerializer(read_only=True)
    current_team = serializers.SerializerMethodField()
    total_teams = serializers.SerializerMethodField()
    total_picks = serializers.SerializerMethodField()

    class Meta:
        model = Draft
        fields = [
            'id', 'league', 'status', 'current_round', 'current_pick',
            'total_rounds', 'pick_order', 'current_team', 'total_teams',
            'total_picks', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'current_team']

    def get_current_team(self, obj):
        team = obj.get_current_team()
        if team:
            return TeamSerializer(team).data
        return None

    def get_total_teams(self, obj):
        return len(obj.league.memberships.all())

    def get_total_picks(self, obj):
        return obj.total_rounds * self.get_total_teams(obj)


class DraftPickSerializer(serializers.ModelSerializer):
    """Serializer for draft picks"""
    team = TeamSerializer(read_only=True)
    player = PlayerSerializer(read_only=True)

    class Meta:
        model = DraftPick
        fields = [
            'id', 'draft', 'team', 'player', 'round_number',
            'pick_number', 'pick_time'
        ]
        read_only_fields = ['id', 'pick_time']


class DraftCreateSerializer(serializers.Serializer):
    """Serializer for creating a new draft"""
    total_rounds = serializers.IntegerField(min_value=1, max_value=20, default=10)

    def validate(self, data):
        league = self.context['league']
        if hasattr(league, 'draft'):
            raise serializers.ValidationError("League already has a draft.")
        return data


class DraftPickCreateSerializer(serializers.Serializer):
    """Serializer for making a draft pick"""
    player_id = serializers.IntegerField()

    def validate(self, data):
        draft = self.context['draft']
        user = self.context['user']

        # Check if draft is active
        if draft.status != 'active':
            raise serializers.ValidationError("Draft is not active.")

        # Check if it's the user's turn
        current_team = draft.get_current_team()
        if not current_team or current_team.owner != user:
            raise serializers.ValidationError("It's not your turn to pick.")

        # Check if player is available
        player_id = data['player_id']
        if DraftPick.objects.filter(draft=draft, player_id=player_id).exists():
            raise serializers.ValidationError("Player has already been drafted.")

        # Check if team already has this player
        if current_team.roster.filter(player_id=player_id).exists():
            raise serializers.ValidationError("Your team already has this player.")

        return data
