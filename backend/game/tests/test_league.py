from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from game.models import Team, League, LeagueMembership, Draft, DraftPick, Player


class LeagueAPITest(TestCase):
    def setUp(self):
        # create users and client
        self.user = User.objects.create_user(username='user1', password='pass')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # create a team for the user
        self.team = Team.objects.create(name='Team1', owner=self.user)

    def test_create_and_join_league(self):
        # create league
        resp = self.client.post('/api/leagues/', {'name': 'My League'})
        self.assertEqual(resp.status_code, 201)
        league_id = resp.data['id']
        self.assertEqual(resp.data['owner']['id'], self.user.id)

        # join the team to the league
        resp2 = self.client.post(f'/api/leagues/{league_id}/join/', {'team_id': self.team.id})
        self.assertEqual(resp2.status_code, 201)
        self.assertTrue(LeagueMembership.objects.filter(league_id=league_id, team=self.team).exists())

        # repeated join returns 200
        resp3 = self.client.post(f'/api/leagues/{league_id}/join/', {'team_id': self.team.id})
        self.assertEqual(resp3.status_code, 200)

        # leaving the league
        resp4 = self.client.post(f'/api/leagues/{league_id}/leave/', {'team_id': self.team.id})
        self.assertEqual(resp4.status_code, 204)
        self.assertFalse(LeagueMembership.objects.filter(league_id=league_id, team=self.team).exists())

    def test_standings_reflect_results(self):
        # create league and two teams (the existing plus another)
        resp = self.client.post('/api/leagues/', {'name': 'StandingsLeague'})
        league_id = resp.data['id']
        other_user = User.objects.create_user(username='user2', password='pw')
        other_team = Team.objects.create(name='Team2', owner=other_user)
        # add both teams to league
        self.client.post(f'/api/leagues/{league_id}/join/', {'team_id': self.team.id})
        # use a new client authenticated as other_user to join second team
        client2 = APIClient(); client2.force_authenticate(user=other_user)
        client2.post(f'/api/leagues/{league_id}/join/', {'team_id': other_team.id})
        # create two matches in league with results
        from game.models import Match
        Match.objects.create(league_id=league_id, team_a=self.team, team_b=other_team, result={'team_a_score': 100, 'team_b_score': 90})
        Match.objects.create(league_id=league_id, team_a=self.team, team_b=other_team, result={'team_a_score': 80, 'team_b_score': 85})
        # fetch league detail and inspect standings
        resp2 = self.client.get(f'/api/leagues/{league_id}/')
        self.assertEqual(resp2.status_code, 200)
        standings = resp2.data['standings']
        # team1 should have 1 win, 1 loss, points_for 180, against 175
        t1 = next((s for s in standings if s['team_id'] == self.team.id), None)
        self.assertIsNotNone(t1)
        self.assertEqual(t1['wins'], 1)
        self.assertEqual(t1['losses'], 1)
        self.assertEqual(t1['points_for'], 180)
        self.assertEqual(t1['points_against'], 175)


class DraftAPITest(TestCase):
    def setUp(self):
        # Create users and teams
        self.user1 = User.objects.create_user(username='user1', password='pass')
        self.user2 = User.objects.create_user(username='user2', password='pass')
        self.team1 = Team.objects.create(name='Team1', owner=self.user1)
        self.team2 = Team.objects.create(name='Team2', owner=self.user2)

        # Create some players
        self.player1 = Player.objects.create(name='Player1', position='PG', team='NBA Team A')
        self.player2 = Player.objects.create(name='Player2', position='SG', team='NBA Team B')
        self.player3 = Player.objects.create(name='Player3', position='SF', team='NBA Team C')

        # Create league and add teams
        self.league = League.objects.create(name='Draft League', owner=self.user1)
        LeagueMembership.objects.create(league=self.league, team=self.team1)
        LeagueMembership.objects.create(league=self.league, team=self.team2)

        # Clients
        self.client1 = APIClient()
        self.client1.force_authenticate(user=self.user1)
        self.client2 = APIClient()
        self.client2.force_authenticate(user=self.user2)

    def test_create_draft(self):
        """Test creating a draft for a league"""
        resp = self.client1.post(f'/api/drafts/leagues/{self.league.id}/draft/', {'total_rounds': 5})
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['league']['id'], self.league.id)
        self.assertEqual(resp.data['total_rounds'], 5)
        self.assertEqual(resp.data['status'], 'pending')

        # Check draft was created
        draft = Draft.objects.get(league=self.league)
        self.assertEqual(draft.total_rounds, 5)
        self.assertEqual(len(draft.pick_order), 5)  # 5 rounds

    def test_start_draft(self):
        """Test starting a draft"""
        # Create draft first
        self.client1.post(f'/api/drafts/leagues/{self.league.id}/draft/', {'total_rounds': 3})

        # Start draft
        resp = self.client1.post(f'/api/drafts/leagues/{self.league.id}/draft/start/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['status'], 'active')

        draft = Draft.objects.get(league=self.league)
        self.assertEqual(draft.status, 'active')

    def test_make_draft_pick(self):
        """Test making a draft pick"""
        # Create and start draft
        self.client1.post(f'/api/drafts/leagues/{self.league.id}/draft/', {'total_rounds': 2})
        self.client1.post(f'/api/drafts/leagues/{self.league.id}/draft/start/')

        draft = Draft.objects.get(league=self.league)
        current_team = draft.get_current_team()
        self.assertEqual(current_team, self.team1)  # First pick should be team1

        # Make pick
        resp = self.client1.post(f'/api/drafts/leagues/{self.league.id}/draft/pick/', {
            'player_id': self.player1.id
        })
        self.assertEqual(resp.status_code, 201)

        # Check pick was created
        pick = DraftPick.objects.get(draft=draft, player=self.player1)
        self.assertEqual(pick.team, self.team1)
        self.assertEqual(pick.round_number, 1)
        self.assertEqual(pick.pick_number, 1)

        # Check draft advanced
        draft.refresh_from_db()
        self.assertEqual(draft.current_pick, 2)

    def test_get_available_players(self):
        """Test getting available players for draft"""
        # Create and start draft
        self.client1.post(f'/api/drafts/leagues/{self.league.id}/draft/', {'total_rounds': 1})
        self.client1.post(f'/api/drafts/leagues/{self.league.id}/draft/start/')

        # Make a pick
        self.client1.post(f'/api/drafts/leagues/{self.league.id}/draft/pick/', {
            'player_id': self.player1.id
        })

        # Get available players
        resp = self.client1.get(f'/api/drafts/leagues/{self.league.id}/draft/available-players/')
        self.assertEqual(resp.status_code, 200)

        # Should have player2 and player3, but not player1
        player_ids = [p['id'] for p in resp.data]
        self.assertIn(self.player2.id, player_ids)
        self.assertIn(self.player3.id, player_ids)
        self.assertNotIn(self.player1.id, player_ids)

    def test_draft_permissions(self):
        """Test draft permissions"""
        # Non-owner cannot create draft
        resp = self.client2.post(f'/api/drafts/leagues/{self.league.id}/draft/', {'total_rounds': 5})
        self.assertEqual(resp.status_code, 403)

        # Create draft as owner
        self.client1.post(f'/api/drafts/leagues/{self.league.id}/draft/', {'total_rounds': 2})
        self.client1.post(f'/api/drafts/leagues/{self.league.id}/draft/start/')

        # Non-current team cannot make pick
        resp = self.client2.post(f'/api/drafts/leagues/{self.league.id}/draft/pick/', {
            'player_id': self.player1.id
        })
        self.assertEqual(resp.status_code, 400)

    def test_draft_validation(self):
        """Test draft validation"""
        # Create and start draft
        self.client1.post(f'/api/drafts/leagues/{self.league.id}/draft/', {'total_rounds': 1})
        self.client1.post(f'/api/drafts/leagues/{self.league.id}/draft/start/')

        # Try to pick already drafted player
        self.client1.post(f'/api/drafts/leagues/{self.league.id}/draft/pick/', {
            'player_id': self.player1.id
        })

        # Try to pick same player again
        resp = self.client2.post(f'/api/drafts/leagues/{self.league.id}/draft/pick/', {
            'player_id': self.player1.id
        })
        self.assertEqual(resp.status_code, 400)
