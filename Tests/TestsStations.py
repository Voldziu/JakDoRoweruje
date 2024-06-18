import pytest
from unittest.mock import patch, Mock


from functionalities import find_n_nearest_stations


@pytest.fixture
def mock_stations():
    class Station:
        def __init__(self, station_name, station_lat, station_len, bikes_available):
            self.station_name = station_name
            self.station_lat = station_lat
            self.station_len = station_len
            self.bikes_available = bikes_available

    return [
        Station("Station 1", 51.11, 17.05, 5),
        Station("Station 2", 51.12, 17.06, 0),
        Station("Station 3", 51.13, 17.07, 10),
        Station("BIKE Station 4", 51.14, 17.08, 8)
    ]


@pytest.fixture
def mock_query_all(mock_stations):
    with patch('app.models.Stations.query') as mock_query:
        mock_query.all.return_value = mock_stations
        yield mock_query


def test_find_n_nearest_stations_no_stations(mock_query_all):
    from app import app
    with app.app_context():
        result = find_n_nearest_stations((51.11, 17.05), 3)
        assert result == []


def test_find_n_nearest_stations_less_than_n(mock_query_all):
    from app import app
    with app.app_context():
        result = find_n_nearest_stations((51.11, 17.05), 10)
        assert len(result) == 2  # Only two stations with bikes available


def test_find_n_nearest_stations_exactly_n(mock_query_all):
    from app import app
    with app.app_context():
        result = find_n_nearest_stations((51.11, 17.05), 2)
        assert len(result) == 2  # Expecting two nearest stations with bikes available


def test_find_n_nearest_stations_with_end_station(mock_query_all):
    from app import app
    with app.app_context():
        result = find_n_nearest_stations((51.11, 17.05), 2, end_station=True)
        assert len(result) == 2  # Expecting two nearest stations that are not named "BIKE"


def test_find_n_nearest_stations_mixed_conditions(mock_query_all):
    from app import app
    with app.app_context():
        result = find_n_nearest_stations((51.11, 17.05), 3)
        expected = [
            ("Station 1", 51.11, 17.05, 5, pytest.approx(0.0, rel=1e-2)),
            ("Station 3", 51.13, 17.07, 10, pytest.approx(2474.0, rel=1e-2)),
        ]
        assert len(result) == 2
        for r, e in zip(result, expected):
            assert r[0] == e[0]
            assert r[1] == e[1]
            assert r[2] == e[2]
            assert r[3] == e[3]
            assert r[4] == pytest.approx(e[4], rel=1e-2)
