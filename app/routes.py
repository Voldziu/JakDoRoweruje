import Constants
from app import app
from flask import render_template, request, jsonify
from forms import DirectionsForm
import requests
from functionalities import geocode


@app.route('/', methods=['GET', 'POST'])
def index():
    cord_form = DirectionsForm()
    return render_template('index.html', form=cord_form)


@app.route('/route', methods=['POST'])
def route():
    data = request.get_json()
    print(data)
    start_point = data['start_point']
    end_point = data['end_point']
    start_coords = geocode(start_point)
    end_coords = geocode(end_point)

    api_key = "73aa3aa2-b205-461e-b88d-1727f0410895"
    graphhopper_url = f"https://graphhopper.com/api/1/route?point={start_coords[0]},{start_coords[1]}&point={end_coords[0]},{end_coords[1]}&vehicle=bike&locale=pl&key={api_key}&points_encoded=false"
    response = requests.get(graphhopper_url)
    data = response.json()

    if response.status_code == 200 and 'paths' in data:
        route = data['paths'][0]['points']['coordinates']
        route_coords = [[lat, lon] for lon, lat in route]
        return jsonify({'route': route_coords, 'start_coords': start_coords, 'end_coords': end_coords})
    else:
        return jsonify({'error': 'Error fetching route data'}), response.status_code


@app.route('/suggestions', methods=["POST"])
def suggestions():
    data = request.get_json()
    #print(data)
    query = data.get('query', '')
    suggestions = []
    if query:
        url = 'https://nominatim.openstreetmap.org/search'
        params = {
            'q': query + "," + Constants.CityName,
            'format': 'json',
            'addressdetails': 1,
            'limit': 5
        }
        headers = {
            'User-Agent': 'YourAppName/1.0 (your-email@example.com)'
        }
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()
        suggestions = [item['display_name'] for item in data]

    #print(suggestions)

    return jsonify(suggestions =suggestions)
