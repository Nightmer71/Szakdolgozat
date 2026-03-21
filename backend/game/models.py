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
    league = models.ForeignKey('League', on_delete=models.CASCADE, related_name='matches', blank=True, null=True)
    team_a = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='home_matches')
    team_b = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='away_matches')
    scheduled_at = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    result = models.JSONField(null=True, blank=True)

    def __str__(self):
        base = f"Match {self.id}: {self.team_a} vs {self.team_b}"
        if self.league:
            base = f"{base} (league={self.league.name})"
        return base


class League(models.Model):
    """A competition container that can hold multiple teams.

    Users create leagues and then add their teams.  League data drives
    scheduling and standings in later months.
    """
    name = models.CharField(max_length=128)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='leagues',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    # optional slug or privacy fields could be added later

    def __str__(self):
        return f"League {self.name} (owner={self.owner})"


class LeagueMembership(models.Model):
    """Association between a team and a league."""
    league = models.ForeignKey(League, on_delete=models.CASCADE, related_name='memberships')
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='league_memberships')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (('league', 'team'),)

    def __str__(self):
        return f"{self.team} in {self.league}"


class Draft(models.Model):
    """A player draft for a league.

    Manages the draft process where teams select players in order.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('completed', 'Completed'),
    ]

    league = models.OneToOneField(League, on_delete=models.CASCADE, related_name='draft')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    current_round = models.PositiveIntegerField(default=1)
    current_pick = models.PositiveIntegerField(default=1)
    total_rounds = models.PositiveIntegerField(default=10)
    pick_order = models.JSONField(help_text="JSON array of team IDs in pick order per round")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Draft for {self.league.name} (Round {self.current_round}, Pick {self.current_pick})"

    def get_current_team(self):
        """Get the team whose turn it is to pick."""
        if self.status != 'active':
            return None

        round_index = self.current_round - 1
        if round_index >= len(self.pick_order):
            return None

        round_order = self.pick_order[round_index]
        pick_index = self.current_pick - 1

        if pick_index >= len(round_order):
            return None

        team_id = round_order[pick_index]
        return Team.objects.get(id=team_id)

    def advance_pick(self):
        """Move to the next pick in the draft."""
        round_index = self.current_round - 1
        round_order = self.pick_order[round_index]

        if self.current_pick >= len(round_order):
            # End of round, go to next round
            self.current_round += 1
            self.current_pick = 1

            if self.current_round > self.total_rounds:
                # Draft complete
                self.status = 'completed'
        else:
            # Next pick in same round
            self.current_pick += 1

        self.save()


class DraftPick(models.Model):
    """A single pick made in a draft."""
    draft = models.ForeignKey(Draft, on_delete=models.CASCADE, related_name='picks')
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='draft_picks')
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='draft_picks')
    round_number = models.PositiveIntegerField()
    pick_number = models.PositiveIntegerField()
    pick_time = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (('draft', 'player'),)  # Player can only be drafted once
        ordering = ['pick_number']

    def __str__(self):
        return f"Round {self.round_number} Pick {self.pick_number}: {self.team} selects {self.player}"
