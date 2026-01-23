from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404

from .models import Player, Team, RosterEntry, Match
from .serializers import (
    UserSerializer,
    PlayerSerializer,
    TeamSerializer,
    TeamDetailSerializer,
    RosterEntrySerializer,
    MatchSerializer,
    MatchSimulationSerializer,
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


class MatchViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Match management and simulation.
    """
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return matches visible to the current user"""
        return Match.objects.filter(
            models.Q(team_a__owner=self.request.user) |
            models.Q(team_b__owner=self.request.user)
        )

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

        # Simulate the match
        result = simulate_match(team_a, team_b, seed=seed)

        # Create match record
        match = Match.objects.create(
            team_a=team_a,
            team_b=team_b,
            created_by=request.user,
            result=result
        )

        return Response(
            MatchSerializer(match).data,
            status=status.HTTP_201_CREATED
        )


class RegisterView(viewsets.ViewSet):
    """User registration endpoint"""
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def register(self, request):
        """Register a new user"""
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if not all([username, email, password]):
            return Response(
                {'error': 'username, email, and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=email).exists():
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
