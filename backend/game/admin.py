from django.contrib import admin
from .models import Player, Team, RosterEntry, Match


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'position', 'team', 'external_id')
    search_fields = ('name', 'external_id')


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'owner')
    search_fields = ('name',)


@admin.register(RosterEntry)
class RosterEntryAdmin(admin.ModelAdmin):
    list_display = ('id', 'team', 'player', 'is_active', 'added_at')


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ('id', 'team_a', 'team_b', 'scheduled_at')
