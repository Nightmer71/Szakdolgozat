from django.core.management.base import BaseCommand
import requests
from game.models import Player


class Command(BaseCommand):
    help = 'Sync players from configured external source (e.g., public NBA API)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--source',
            default='nba',
            help='Which external source to use (default: nba)'
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=None,
            help='Limit number of players to sync (default: all)'
        )

    def handle(self, *args, **options):
        source = options.get('source')
        limit = options.get('limit')

        if source == 'nba':
            self.sync_from_nba(limit)
        else:
            self.stdout.write(
                self.style.WARNING(f'Source "{source}" is not supported. Use --source=nba')
            )

    def sync_from_nba(self, limit=None):
        """Fetch players from public NBA API and upsert to Player model"""
        self.stdout.write('Starting NBA player sync...')

        try:
            # Fetch teams first
            teams_url = 'https://publicapi.dev/api/nba/teams'
            teams_response = requests.get(teams_url, timeout=10)
            teams_response.raise_for_status()
            teams_data = teams_response.json()

            total_synced = 0
            total_teams = len(teams_data) if isinstance(teams_data, list) else 0

            if not isinstance(teams_data, list):
                self.stdout.write(
                    self.style.WARNING('Unexpected API response format for teams')
                )
                return

            # Process each team's players
            for team in teams_data[:limit] if limit else teams_data:
                team_id = team.get('id')
                team_name = team.get('name', 'Unknown')

                # Fetching players for a specific team
                try:
                    players_url = f'https://publicapi.dev/api/nba/teams/{team_id}/players'
                    players_response = requests.get(players_url, timeout=10)
                    players_response.raise_for_status()
                    players_data = players_response.json()

                    if not isinstance(players_data, list):
                        self.stdout.write(
                            self.style.WARNING(f'Unexpected response for team {team_name}')
                        )
                        continue

                    # Upsert players
                    for player_data in players_data:
                        external_id = str(player_data.get('id', ''))
                        name = player_data.get('name', 'Unknown')
                        position = player_data.get('position', '')
                        jersey = player_data.get('jerseyNumber', '')

                        # Try to fetch per-player stats if available
                        stats = None
                        player_id_for_stats = player_data.get('id')
                        if player_id_for_stats:
                            try:
                                stats_url = f'https://publicapi.dev/api/nba/players/{player_id_for_stats}/stats'
                                stats_resp = requests.get(stats_url, timeout=6)
                                if stats_resp.ok:
                                    stats = stats_resp.json()
                            except requests.RequestException:
                                # Non-fatal: keep going without stats
                                stats = None

                        metadata = {
                            'jersey_number': jersey,
                            'full_data': player_data,
                        }
                        if stats is not None:
                            metadata['stats'] = stats

                        player, created = Player.objects.update_or_create(
                            external_id=external_id,
                            defaults={
                                'name': name,
                                'position': position,
                                'team': team_name,
                                'metadata': metadata,
                            }
                        )

                        if created:
                            self.stdout.write(
                                self.style.SUCCESS(f'✓ Created: {name} ({position}) - {team_name}')
                            )
                            total_synced += 1
                        else:
                            self.stdout.write(f'~ Updated: {name}')

                except requests.RequestException as e:
                    self.stdout.write(
                        self.style.ERROR(f'Error fetching players for {team_name}: {str(e)}')
                    )
                    continue

            self.stdout.write(
                self.style.SUCCESS(
                    f'\n✓ Sync complete! Total new players: {total_synced}'
                )
            )

        except requests.RequestException as e:
            self.stdout.write(
                self.style.ERROR(f'Error connecting to NBA API: {str(e)}')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Unexpected error: {str(e)}')
            )
