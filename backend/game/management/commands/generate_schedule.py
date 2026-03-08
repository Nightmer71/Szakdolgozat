from django.core.management.base import BaseCommand, CommandError
from game.models import League, Match, LeagueMembership


def round_robin_pairs(items):
    """Yield unique unordered pairs from the given iterable."""
    items = list(items)
    n = len(items)
    for i in range(n):
        for j in range(i + 1, n):
            yield items[i], items[j]


class Command(BaseCommand):
    help = "Generate a simple round-robin schedule for a league (one match per unique team pair)."

    def add_arguments(self, parser):
        parser.add_argument('league_id', type=int, help='ID of the league to schedule')
        parser.add_argument('--reverse', action='store_true', help='Also schedule reverse fixtures (B vs A)')

    def handle(self, *args, **options):
        league_id = options['league_id']
        try:
            league = League.objects.get(id=league_id)
        except League.DoesNotExist:
            raise CommandError(f'League {league_id} does not exist')

        memberships = LeagueMembership.objects.filter(league=league).select_related('team')
        teams = [m.team for m in memberships]
        if len(teams) < 2:
            self.stdout.write('Need at least two teams to generate schedule.')
            return

        created = 0
        for a, b in round_robin_pairs(teams):
            # check existing match irrespective of order
            if not Match.objects.filter(league=league, team_a=a, team_b=b).exists() and not Match.objects.filter(league=league, team_a=b, team_b=a).exists():
                Match.objects.create(league=league, team_a=a, team_b=b)
                created += 1
            if options['reverse']:
                if not Match.objects.filter(league=league, team_a=b, team_b=a).exists():
                    Match.objects.create(league=league, team_a=b, team_b=a)
                    created += 1
        self.stdout.write(f'Generated {created} matches for league {league_id}')
