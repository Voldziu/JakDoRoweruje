import pytest
from unittest.mock import patch, MagicMock
 # replace 'functionalities' with the actual module name
from app.models import Stations
from app import db
from app import app
import random


@pytest.fixture(scope='module')
def new_app():
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['TESTING'] = True
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()
@pytest.fixture
def mock_stations(new_app):
    with new_app.app_context():
        base_lat = 51.1097
        base_lng = 17.0316
        stations = [
            Stations(station_name=f'{"BIKEStation" if i % 10 == 0 else "Station"}{i+1}', station_lat=base_lat + (i % 10) * 0.001,
                     station_len=base_lng + (i // 10) * 0.001, bikes_available=(i * 3) % 16)
            for i in range(50)
        ]
        db.session.add_all(stations)
        db.session.commit()

        db.session.add_all(stations)
        db.session.commit()


def test_find_n_nearest_stations(mock_stations,new_app):
    coords = (40.712776, -74.005974)

    from functionalities import find_n_nearest_stations

    with new_app.app_context():
        # Test for start station (bikes_available > 0)
        result = find_n_nearest_stations(coords, 2)
        print(result)
        assert len(result) == 2
        assert result[0][0] == 'Station10'

        # Test for end station (not include stations with "BIKE" in their name)
        result = find_n_nearest_stations(coords, 5, end_station=True)
        assert len(result) == 5
        assert result[0][0] == 'Station10'


def test_get_nearest_stations(mock_stations, new_app):
    from functionalities import get_nearest_stations
    with new_app.app_context():
        result = get_nearest_stations("18, Szewska, Dzielnica Czterech Wyznań, Stare Miasto, Wrocław, województwo dolnośląskie, 50-139, Polska",
                                      "10, Plac Tadeusza Kościuszki, Przedmieście Świdnickie, Wrocław, województwo dolnośląskie, 50-028, Polska")

        assert len(result['start_stations']) == 5
        assert result['start_stations'][0]['station_name'] == 'Station42'
        assert result['start_stations'][0]['station_lat'] == pytest.approx(51.1107,rel=1e-5)
        assert result['start_stations'][0]['station_lng'] == pytest.approx(17.0356, rel=1e-5)

        assert len(result['end_stations']) == 5
        assert result['end_stations'][0]['station_name'] == 'Station2'
        assert result['end_stations'][0]['station_lat'] == pytest.approx(51.1107, rel=1e-5)
        assert result['end_stations'][0]['station_lng'] == pytest.approx(17.0316, rel=1e-5)
