from django.core.management.base import BaseCommand
from game.player_sync import sync_players_from_nba


class Command(BaseCommand):
    help = 'Sync players from the public NBA API'

    def handle(self, *args, **options):
        self.stdout.write('Starting NBA player sync...')
        sync_players_from_nba()
        self.stdout.write(self.style.SUCCESS('Sync complete.'))
