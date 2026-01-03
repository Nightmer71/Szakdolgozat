from django.conf import settings
from django.db import models


class Player(models.Model):
    external_id = models.CharField(max_length=128, blank=True, null=True, db_index=True)
    name = models.CharField(max_length=256)
    position = models.CharField(max_length=32, blank=True, null=True)
    team = models.CharField(max_length=128, blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.name} ({self.position})" if self.position else self.name


class Team(models.Model):
    name = models.CharField(max_length=128)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='teams')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} (owner={self.owner})"


class RosterEntry(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='roster')
    player = models.ForeignKey(Player, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (('team', 'player'),)

    def __str__(self):
        return f"{self.player} in {self.team}"


class Match(models.Model):
    team_a = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='home_matches')
    team_b = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='away_matches')
    scheduled_at = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    result = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"Match {self.id}: {self.team_a} vs {self.team_b}"
