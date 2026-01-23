from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Player, Team, RosterEntry, Match


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


class MatchSerializer(serializers.ModelSerializer):
    team_a = TeamSerializer(read_only=True)
    team_b = TeamSerializer(read_only=True)
    team_a_id = serializers.IntegerField(write_only=True)
    team_b_id = serializers.IntegerField(write_only=True)
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Match
        fields = ['id', 'team_a', 'team_b', 'team_a_id', 'team_b_id', 'scheduled_at', 'created_by', 'created_at', 'result']
        read_only_fields = ['id', 'created_by', 'created_at', 'result']


class MatchSimulationSerializer(serializers.Serializer):
    """Serializer for match simulation requests"""
    team_a_id = serializers.IntegerField()
    team_b_id = serializers.IntegerField()
    seed = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, data):
        if data['team_a_id'] == data['team_b_id']:
            raise serializers.ValidationError("Teams must be different.")
        return data
