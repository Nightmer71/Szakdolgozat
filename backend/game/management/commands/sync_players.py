from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Sync players from configured external source (e.g., public NBA API)'

    def add_arguments(self, parser):
        parser.add_argument('--source', default='nba', help='Which external source to use')

    def handle(self, *args, **options):
        source = options.get('source')
        # Skeleton implementation: we will implement HTTP fetching and upsert logic in Month 3
        if source != 'nba':
            self.stdout.write(self.style.WARNING('Only `nba` source is supported at the moment'))
            return
        self.stdout.write('Placeholder: will fetch players from https://publicapi.dev/nba-data-api and upsert to Player model')
