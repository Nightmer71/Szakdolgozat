from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Draft, Player
from .serializers import DraftSerializer, DraftPickSerializer, PlayerSerializer


class DraftConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.league_id = self.scope['url_route']['kwargs']['league_id']
        self.group_name = f"draft_{self.league_id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self.send_current_state()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def send_current_state(self):
        draft = await self.get_draft()
        if not draft:
            await self.send_json({'type': 'draft.state', 'draft': None, 'picks': []})
            return

        picks = await self.get_picks(draft)
        available = await self.get_available_players(draft)

        await self.send_json({
            'type': 'draft.state',
            'draft': DraftSerializer(draft).data,
            'picks': DraftPickSerializer(picks, many=True).data,
            'available_players': PlayerSerializer(available, many=True).data,
        })

    @database_sync_to_async
    def get_draft(self):
        try:
            return Draft.objects.get(league__id=self.league_id)
        except Draft.DoesNotExist:
            return None

    @database_sync_to_async
    def get_picks(self, draft):
        return list(draft.picks.select_related('team', 'player').all())

    @database_sync_to_async
    def get_available_players(self, draft):
        drafted_ids = draft.picks.values_list('player_id', flat=True)
        return list(Player.objects.exclude(id__in=drafted_ids))

    async def receive_json(self, content):
        await self.send_json({'type': 'heartbeat', 'status': 'ok'})

    async def draft_update(self, event):
        payload = event['payload']
        await self.send_json({'type': 'draft.update', 'payload': payload})
