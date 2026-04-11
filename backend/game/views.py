import threading
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth.models import User
from django.db import models
from django.shortcuts import get_object_or_404
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .player_sync import sync_players_from_nba

from .models import Player, Team, RosterEntry, Match, League, LeagueMembership, Draft, DraftPick
from .serializers import (
    UserSerializer,
    PlayerSerializer,
    TeamSerializer,
    TeamDetailSerializer,
    RosterEntrySerializer,
    LeagueSerializer,
    LeagueMembershipSerializer,
    MatchSerializer,
    MatchSimulationSerializer,
    DraftSerializer,
    DraftPickSerializer,
    DraftCreateSerializer,
    DraftPickCreateSerializer,
)
from .match_simulator import simulate_match


class PlayerViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing players.
    Supports filtering by name, position, and team.
    """
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Player.objects.all()

        player_id = self.request.query_params.get('player_id', None)
        if player_id:
            queryset = queryset.filter(id=player_id)
        
        # Filter by name (search)
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        # Filter by position
        position = self.request.query_params.get('position', None)
        if position:
            queryset = queryset.filter(position__iexact=position)
        
        # Filter by team
        team = self.request.query_params.get('team', None)
        if team:
            queryset = queryset.filter(team__iexact=team)
        
        return queryset


class TeamViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Team management.
    Users can only view/edit their own teams.
    """
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return teams owned by the current user"""
        return Team.objects.filter(owner=self.request.user)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TeamDetailSerializer
        return TeamSerializer

    def perform_create(self, serializer):
        """Automatically set the owner to the current user"""
        serializer.save(owner=self.request.user)

    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def add_player(self, request, pk=None):
        """Add a player to a team's roster"""
        team = self.get_object()
        player_id = request.data.get('player_id')

        if not player_id:
            return Response(
                {'error': 'player_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            player = Player.objects.get(id=player_id)
        except Player.DoesNotExist:
            return Response(
                {'error': 'Player not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        roster_entry, created = RosterEntry.objects.get_or_create(
            team=team,
            player=player,
            defaults={'is_active': True}
        )

        if not created:
            return Response(
                {'message': 'Player is already in the team'},
                status=status.HTTP_200_OK
            )

        serializer = RosterEntrySerializer(roster_entry)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def remove_player(self, request, pk=None):
        """Remove a player from a team's roster"""
        team = self.get_object()
        player_id = request.data.get('player_id')

        if not player_id:
            return Response(
                {'error': 'player_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            roster_entry = RosterEntry.objects.get(team=team, player_id=player_id)
            roster_entry.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except RosterEntry.DoesNotExist:
            return Response(
                {'error': 'Player not in team'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def set_player_active(self, request, pk=None):
        """Set a roster entry's is_active flag (activate/deactivate player in roster)"""
        team = self.get_object()
        player_id = request.data.get('player_id')
        is_active = request.data.get('is_active')

        if player_id is None or is_active is None:
            return Response(
                {'error': 'player_id and is_active are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            roster_entry = RosterEntry.objects.get(team=team, player_id=player_id)
            roster_entry.is_active = bool(is_active)
            roster_entry.save()
            serializer = RosterEntrySerializer(roster_entry)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except RosterEntry.DoesNotExist:
            return Response({'error': 'Player not in team'}, status=status.HTTP_404_NOT_FOUND)




class LeagueViewSet(viewsets.ModelViewSet):
    """API endpoints for managing leagues.

    Users can create leagues and add their teams via membership actions.
    """
    queryset = League.objects.all()
    serializer_class = LeagueSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return League.objects.all()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def destroy(self, request, *args, **kwargs):
        """Only league owners can delete their leagues."""
        league = self.get_object()
        if league.owner != request.user:
            return Response({'error': 'Only league owner can delete this league'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def join(self, request, pk=None):
        """Add a team to this league.

        Expects POST {"team_id": <id>} where the team belongs to the
        requesting user.
        """
        league = self.get_object()
        team_id = request.data.get('team_id')
        if not team_id:
            return Response({'error': 'team_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            team = Team.objects.get(id=team_id, owner=request.user)
        except Team.DoesNotExist:
            return Response({'error': 'Team not found or not owned by you'}, status=status.HTTP_404_NOT_FOUND)
        membership, created = LeagueMembership.objects.get_or_create(
            league=league,
            team=team,
        )
        if not created:
            return Response({'message': 'Team already in league'}, status=status.HTTP_200_OK)
        serializer = LeagueMembershipSerializer(membership)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def leave(self, request, pk=None):
        """Remove a team from this league."""
        league = self.get_object()
        team_id = request.data.get('team_id')
        if not team_id:
            return Response({'error': 'team_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            membership = LeagueMembership.objects.get(league=league, team__id=team_id, team__owner=request.user)
            membership.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except LeagueMembership.DoesNotExist:
            return Response({'error': 'Team not in league or not yours'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'])
    def schedule(self, request, pk=None):
        """Fetch the schedule of matches for this league."""
        league = self.get_object()
        matches = league.matches.all()
        serializer = MatchSerializer(matches, many=True)
        return Response({'schedule': serializer.data})

    @action(detail=True, methods=['get'])
    def standings(self, request, pk=None):
        """Fetch the standings for this league.

        Standings reflect wins/losses and points for/against based on
        completed match results.
        """
        league = self.get_object()
        serializer = self.get_serializer(league)
        return Response({'standings': serializer.data['standings']})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def generate_schedule(self, request, pk=None):
        """Generate a simple round-robin schedule for this league via API."""
        league = self.get_object()
        # only league owner or member may generate schedule
        user = request.user
        if league.owner != user and not league.memberships.filter(team__owner=user).exists():
            return Response({'error': 'Not a member of league'}, status=status.HTTP_403_FORBIDDEN)
        reverse = bool(request.data.get('reverse', False))
        teams = [m.team for m in league.memberships.all()]
        if len(teams) < 2:
            return Response({'detail': 'Need at least two teams'}, status=status.HTTP_400_BAD_REQUEST)
        created = 0
        for i in range(len(teams)):
            for j in range(i + 1, len(teams)):
                a = teams[i]; b = teams[j]
                if not Match.objects.filter(league=league, team_a=a, team_b=b).exists() and not Match.objects.filter(league=league, team_a=b, team_b=a).exists():
                    Match.objects.create(league=league, team_a=a, team_b=b)
                    created += 1
                if reverse and not Match.objects.filter(league=league, team_a=b, team_b=a).exists():
                    Match.objects.create(league=league, team_a=b, team_b=a)
                    created += 1
        return Response({'created': created})


class MatchViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Match management and simulation.
    """
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return matches visible to the current user"""
        user = self.request.user
        return Match.objects.filter(
            models.Q(team_a__owner=user) |
            models.Q(team_b__owner=user) |
            models.Q(league__memberships__team__owner=user)
        ).distinct()

    def perform_create(self, serializer):
        """Automatically set creator to current user"""
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def simulate(self, request):
        """Simulate a match between two teams"""
        serializer = MatchSimulationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        team_a_id = serializer.validated_data['team_a_id']
        team_b_id = serializer.validated_data['team_b_id']
        seed = serializer.validated_data.get('seed')

        # Verify both teams exist and belong to the user
        team_a = get_object_or_404(Team, id=team_a_id, owner=request.user)
        team_b = get_object_or_404(Team, id=team_b_id, owner=request.user)

        threading.Thread(target=sync_players_from_nba, daemon=True).start()

        # Simulate the match
        result = simulate_match(team_a, team_b, seed=seed)

        # Create match record (optionally associate with league)
        match_kwargs = {
            'team_a': team_a,
            'team_b': team_b,
            'created_by': request.user,
            'result': result,
        }
        league_id = serializer.validated_data.get('league_id')
        if league_id:
            # ensure the league exists and user belongs to it
            league = get_object_or_404(League, id=league_id)
            if not league.memberships.filter(team__owner=request.user).exists() and league.owner != request.user:
                return Response({'error': 'Not a member of league'}, status=status.HTTP_403_FORBIDDEN)
            match_kwargs['league'] = league
        match = Match.objects.create(**match_kwargs)

        return Response(
            MatchSerializer(match).data,
            status=status.HTTP_201_CREATED
        )


class DraftViewSet(viewsets.ViewSet):
    """API endpoints for managing drafts in leagues."""
    permission_classes = [permissions.IsAuthenticated]

    def get_draft_for_league(self, league_id):
        """Get draft for a league, ensuring user has access."""
        league = get_object_or_404(League, id=league_id)
        # Check if user owns league or has teams in it
        if (league.owner != self.request.user and
            not league.memberships.filter(team__owner=self.request.user).exists()):
            raise permissions.PermissionDenied("Not a member of this league")
        return league.draft

    def broadcast_draft_update(self, draft):
        channel_layer = get_channel_layer()
        if not channel_layer:
            return

        picks = DraftPickSerializer(draft.picks.select_related('team', 'player').all(), many=True).data
        drafted_ids = draft.picks.values_list('player_id', flat=True)
        available_players = PlayerSerializer(Player.objects.exclude(id__in=drafted_ids), many=True).data

        payload = {
            'draft': DraftSerializer(draft).data,
            'picks': picks,
            'available_players': available_players,
        }

        async_to_sync(channel_layer.group_send)(
            f"draft_{draft.league.id}",
            {
                'type': 'draft_update',
                'payload': payload,
            }
        )

    @action(detail=False, methods=['get'])
    def get_draft(self, request, league_id=None):
        """Get the draft for a specific league."""
        try:
            draft = self.get_draft_for_league(league_id)
            serializer = DraftSerializer(draft)
            return Response(serializer.data)
        except League.draft.RelatedObjectDoesNotExist:
            return Response({'detail': 'No draft found for this league'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def create_draft(self, request, league_id=None):
        """Create a new draft for a league (league owner only)."""
        league = get_object_or_404(League, id=league_id)
        if league.owner != request.user:
            return Response({'error': 'Only league owner can create drafts'}, status=status.HTTP_403_FORBIDDEN)

        serializer = DraftCreateSerializer(data=request.data, context={'league': league})
        serializer.is_valid(raise_exception=True)

        # Create pick order (snake draft)
        memberships = list(league.memberships.all())
        teams = [m.team for m in memberships]
        total_rounds = serializer.validated_data['total_rounds']

        pick_order = []
        for round_num in range(total_rounds):
            if round_num % 2 == 0:
                # Even rounds: normal order
                round_order = [team.id for team in teams]
            else:
                # Odd rounds: reverse order (snake)
                round_order = [team.id for team in reversed(teams)]
            pick_order.append(round_order)

        draft = Draft.objects.create(
            league=league,
            total_rounds=total_rounds,
            pick_order=pick_order
        )

        serializer = DraftSerializer(draft)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def start_draft(self, request, league_id=None):
        """Start a draft (league owner only)."""
        league = get_object_or_404(League, id=league_id)
        if league.owner != request.user:
            return Response({'error': 'Only league owner can start drafts'}, status=status.HTTP_403_FORBIDDEN)

        try:
            draft = league.draft
        except League.draft.RelatedObjectDoesNotExist:
            return Response({'error': 'No draft found for this league'}, status=status.HTTP_404_NOT_FOUND)

        if draft.status != 'pending':
            return Response({'error': 'Draft is not in pending state'}, status=status.HTTP_400_BAD_REQUEST)

        draft.status = 'active'
        draft.save()

        threading.Thread(target=sync_players_from_nba, daemon=True).start()

        self.broadcast_draft_update(draft)

        serializer = DraftSerializer(draft)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def make_pick(self, request, league_id=None):
        """Make a draft pick."""
        league = get_object_or_404(League, id=league_id)
        try:
            draft = league.draft
        except League.draft.RelatedObjectDoesNotExist:
            return Response({'error': 'No draft found for this league'}, status=status.HTTP_404_NOT_FOUND)

        serializer = DraftPickCreateSerializer(
            data=request.data,
            context={'draft': draft, 'user': request.user}
        )
        serializer.is_valid(raise_exception=True)

        player_id = serializer.validated_data['player_id']
        current_team = draft.get_current_team()
        player = get_object_or_404(Player, id=player_id)

        # Create the pick
        pick = DraftPick.objects.create(
            draft=draft,
            team=current_team,
            player=player,
            round_number=draft.current_round,
            pick_number=draft.current_pick
        )

        # Add the player to the team's roster
        RosterEntry.objects.get_or_create(
            team=current_team,
            player=player,
            defaults={'is_active': True}
        )

        # Advance the draft
        draft.advance_pick()

        # broadcast draft updates to websocket subscribers
        self.broadcast_draft_update(draft)

        pick_serializer = DraftPickSerializer(pick)
        return Response(pick_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def get_picks(self, request, league_id=None):
        """Get all picks for a league's draft."""
        try:
            draft = self.get_draft_for_league(league_id)
            picks = draft.picks.all()
            serializer = DraftPickSerializer(picks, many=True)
            return Response(serializer.data)
        except League.draft.RelatedObjectDoesNotExist:
            return Response({'detail': 'No draft found for this league'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def get_available_players(self, request, league_id=None):
        """Get players available for drafting."""
        try:
            draft = self.get_draft_for_league(league_id)
            # Get all drafted player IDs
            drafted_player_ids = set(draft.picks.values_list('player_id', flat=True))
            # Get all players not drafted
            available_players = Player.objects.exclude(id__in=drafted_player_ids)
            serializer = PlayerSerializer(available_players, many=True)
            return Response(serializer.data)
        except League.draft.RelatedObjectDoesNotExist:
            return Response({'detail': 'No draft found for this league'}, status=status.HTTP_404_NOT_FOUND)


class RegisterView(viewsets.ViewSet):
    """User registration endpoint"""
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def register(self, request):
        """Register a new user"""
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        print(f"Register attempt: username={username}, email={email}, password={'*' * len(password) if password else None}")

        if not all([username, email, password]):
            print("Missing required fields")
            return Response(
                {'error': 'username, email, and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            print(f"Username {username} already exists")
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=email).exists():
            print(f"Email {email} already exists")
            return Response(
                {'error': 'Email already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED
        )


# Import models for Q filter
from django.db import models
