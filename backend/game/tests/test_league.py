from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from game.models import Team, League, LeagueMembership


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
