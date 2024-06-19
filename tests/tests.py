import pytest
from unittest.mock import patch, Mock

test_cases_geocode = [
    ('Wrocław, Poland', (51.11, 17.05)),
    ('New York, NY, USA', (40.7128, -74.0060)),
    ('Paris, France', (48.8566, 2.3522))
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


test_cases_reverse = [
    ((51.11, 17.05), 'Wrocław, Poland'),
    ((40.7128, -74.0060), 'New York, NY, USA'),
    ((48.8566, 2.3522), 'Paris, France')
]


@pytest.mark.parametrize("coords, expected", test_cases_reverse)
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
