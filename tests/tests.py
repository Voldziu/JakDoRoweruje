import pytest
from unittest.mock import patch, Mock

test_cases_geocode = [
    ('Wrocław, Poland', (51.11, 17.05)),
    ('New York, NY, USA', (40.7128, -74.0060)),
    ('Paris, France', (48.8566, 2.3522)),
    ('89, Kazimierza Wielkiego, Stare Miasto, Wrocław, województwo dolnośląskie, 50-077, Polska', (51.107062640939944, 17.0368766784668)),
    ('19, Szczęśliwa, Gajowice, Wrocław, województwo dolnośląskie, 53-445, Polska', (51.097944945631106, 17.010612487792972)),
    ('45, Śliczna, Huby, Wrocław, województwo dolnośląskie, 50-566, Polska', (51.08466981996131, 17.040996551513675)),
    ('MPWiK, Okólna, Rakowiec, Przedmieście Oławskie, Wrocław, województwo dolnośląskie, 50-421, Polska', (51.10102034562328,17.063484191894535)),
    ('26, Bartosza Głowackiego, Sępolno, Biskupin-Sępolno-Dąbie-Bartoszowice, Wrocław, województwo dolnośląskie, 51-691, Polska', (51.112349001460764 ,17.09609985351563)),
    ('Maleńka, Bolesława Prusa, Ołbin, Wrocław, województwo dolnośląskie, 50-339, Polska', (51.119792034925105 ,17.057046890258793)),
    ('22, Józefa Ignacego Kraszewskiego, Kleczków, Wrocław, województwo dolnośląskie, 50-229, Polska', (51.12847405865121 ,17.03267097473145)),
    ('30, Henryka Michała Kamieńskiego, Karłowice, Karłowice-Różanka, Wrocław, województwo dolnośląskie, 51-124, Polska', (51.143138118388045 ,17.0368766784668))

]


@pytest.mark.parametrize("input, coords", test_cases_geocode)
@patch('requests.get')
def test_geocode(mock_get, input, coords):
    from app import app
    from functionalities import geocode
    with app.app_context():
        # Mock response from the geocoding API
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {'lat': coords[0], 'lon': coords[1]}
        ]

        mock_get.return_value = mock_response

        # Call the function
        result = geocode(input)

        # Check if result is as expected
        assert result == [coords[0], coords[1]]


test_cases_geocode = [
    ((51.11, 17.05), 'Wrocław, Poland'),
    ((40.7128, -74.0060), 'New York, NY, USA'),
    ((48.8566, 2.3522), 'Paris, France'),
    ((51.107062640939944, 17.0368766784668), '89, Kazimierza Wielkiego, Stare Miasto, Wrocław, województwo dolnośląskie, 50-077, Polska'),
    ((51.097944945631106, 17.010612487792972), '19, Szczęśliwa, Gajowice, Wrocław, województwo dolnośląskie, 53-445, Polska'),
    ((51.08466981996131, 17.040996551513675), '45, Śliczna, Huby, Wrocław, województwo dolnośląskie, 50-566, Polska'),
    ((51.10102034562328, 17.063484191894535), 'MPWiK, Okólna, Rakowiec, Przedmieście Oławskie, Wrocław, województwo dolnośląskie, 50-421, Polska'),
    ((51.112349001460764, 17.09609985351563), '26, Bartosza Głowackiego, Sępolno, Biskupin-Sępolno-Dąbie-Bartoszowice, Wrocław, województwo dolnośląskie, 51-691, Polska'),
    ((51.119792034925105, 17.057046890258793), 'Maleńka, Bolesława Prusa, Ołbin, Wrocław, województwo dolnośląskie, 50-339, Polska'),
    ((51.12847405865121, 17.03267097473145), '22, Józefa Ignacego Kraszewskiego, Kleczków, Wrocław, województwo dolnośląskie, 50-229, Polska'),
    ((51.143138118388045, 17.0368766784668), '30, Henryka Michała Kamieńskiego, Karłowice, Karłowice-Różanka, Wrocław, województwo dolnośląskie, 51-124, Polska')
]


@pytest.mark.parametrize("coords, expected", test_cases_geocode)
@patch('requests.get')
def test_reverse_geocode(mock_get, coords, expected):
    from app import app
    from functionalities import reverse_geocode

    with app.app_context():
        # Mock response from the reverse geocoding API
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'display_name': expected
        }

        mock_get.return_value = mock_response

        # Call the function
        result = reverse_geocode(*coords)

        # Check if result is as expected
        assert result == expected
