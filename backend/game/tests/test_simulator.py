from django.test import SimpleTestCase
from unittest.mock import patch
from types import SimpleNamespace
from game.match_simulator import simulate_match


class SimulatorTestCase(SimpleTestCase):
    """Tests for the match simulator that do not require a database.

    We avoid invoking the ORM by mocking ``RosterEntry.objects.filter`` so
    that the code can be exercised with simple in-memory objects.  Using
    ``SimpleTestCase`` ensures Django settings are configured but no test
    database is created.
    """

    # helpers for creating lightweight dummy objects
    def make_player(self, id, name, position, metadata=None):
        return SimpleNamespace(id=id, name=name, position=position, metadata=metadata or {})

    def make_entry(self, player):
        return SimpleNamespace(player=player)

    def _patch_rosters(self, team_a, team_b, entries_a, entries_b):
        """Patch the ORM filter call to return our dummy roster entries.

        We return a lightweight sequence that implements ``select_related`` so
        that the simulator code (which calls ``.select_related('player')``) can
        operate without raising an ``AttributeError``.
        """
        class DummyQS(list):
            def select_related(self, *args, **kwargs):
                return self

        def filter_side_effect(*args, **kwargs):
            team = kwargs.get('team') or (args[0] if args else None)
            is_active = kwargs.get('is_active')
            if team == team_a:
                return DummyQS(self.make_entry(p) for p in entries_a)
            if team == team_b:
                return DummyQS(self.make_entry(p) for p in entries_b)
            return DummyQS()

        patcher = patch('game.match_simulator.RosterEntry.objects.filter', side_effect=filter_side_effect)
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_simulation_deterministic_with_seed(self):
        # set up simple team objects
        team_a = SimpleNamespace(id=1, name="A Team")
        team_b = SimpleNamespace(id=2, name="B Team")

        # construct dummy players with varying stats
        p1 = self.make_player(1, "Player A1", "PG", {"stats": {"ppg": 20}})
        p2 = self.make_player(2, "Player A2", "SG", {"stats": {"ppg": 10}})
        p3 = self.make_player(3, "Player B1", "C", {"stats": {"ppg": 15}})
        p4 = self.make_player(4, "Player B2", "PF", {"stats": {"ppg": 8}})

        # patch roster query results
        self._patch_rosters(team_a, team_b, [p1, p2], [p3, p4])

        res1 = simulate_match(team_a, team_b, seed=42, minutes=10)
        res2 = simulate_match(team_a, team_b, seed=42, minutes=10)
        self.assertEqual(res1, res2)
        # Basic sanity checks
        self.assertIn('timeline', res1)
        self.assertIn('team_a_score', res1)
        self.assertIn('team_b_score', res1)
        # Totals match timeline
        total_a = sum(e['points'] for e in res1['timeline'] if e['team_id'] == team_a.id)
        total_b = sum(e['points'] for e in res1['timeline'] if e['team_id'] == team_b.id)
        self.assertEqual(total_a, res1['team_a_score'])
        self.assertEqual(total_b, res1['team_b_score'])

    def test_empty_roster_returns_error(self):
        team_a = SimpleNamespace(id=5, name="Empty A")
        team_b = SimpleNamespace(id=6, name="Empty B")
        # patch with no entries for either side
        self._patch_rosters(team_a, team_b, [], [])
        result = simulate_match(team_a, team_b, seed=123)
        self.assertIn('error', result)
        self.assertEqual(result['team_a_score'], 0)
        self.assertEqual(result['team_b_score'], 0)

    def test_one_sided_roster(self):
        team_a = SimpleNamespace(id=7, name="Full A")
        team_b = SimpleNamespace(id=8, name="Empty B")
        solo = self.make_player(9, "Solo", "C", {'stats': {'ppg': 25}})
        self._patch_rosters(team_a, team_b, [solo], [])
        res = simulate_match(team_a, team_b, seed=999)
        self.assertIn('error', res)

# Additional serializer-level tests that don't hit the database
class MatchSerializerSummaryTests(SimpleTestCase):
    """Tests to confirm the MatchSerializer generates a proper summary."""

    def make_team(self, id, name):
        return SimpleNamespace(id=id, name=name)

    def make_match(self, team_a, team_b, timeline):
        m = SimpleNamespace()
        m.team_a = team_a
        m.team_b = team_b
        m.result = {'timeline': timeline}
        return m

    def test_summary_top_scorers_and_quarters(self):
        team_a = self.make_team(1, "A")
        team_b = self.make_team(2, "B")
        timeline = [
            {'minute': 1, 'team_id': 1, 'player_id': 10, 'points': 2},
            {'minute': 5, 'team_id': 2, 'player_id': 20, 'points': 3},
            {'minute': 13, 'team_id': 1, 'player_id': 10, 'points': 2},
            {'minute': 25, 'team_id': 2, 'player_id': 21, 'points': 2},
        ]
        match = self.make_match(team_a, team_b, timeline)
        from game.serializers import MatchSerializer
        data = MatchSerializer(match).data
        # quarter score assertions (12‑minute quarters)
        # minutes: 1->Q1(A2), 5->Q1(B3), 13->Q2(A2), 25->Q3(B2)
        self.assertEqual(data['summary']['quarters'][0], {'team_a': 2, 'team_b': 3})
        self.assertEqual(data['summary']['quarters'][1], {'team_a': 2, 'team_b': 0})
        self.assertEqual(data['summary']['quarters'][2], {'team_a': 0, 'team_b': 2})
        # top scorer assertions
        self.assertEqual(data['summary']['top_scorers']['team_a'][0]['player_id'], 10)
        self.assertEqual(data['summary']['top_scorers']['team_a'][0]['points'], 4)
        self.assertEqual(data['summary']['top_scorers']['team_b'][0]['player_id'], 20)
        self.assertEqual(data['summary']['top_scorers']['team_b'][0]['points'], 3)
