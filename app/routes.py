from app import app
from flask import render_template, request, jsonify
from forms import CoordinatesForm
import requests


@app.route('/', methods=['GET', 'POST'])
def index():
    cord_form = CoordinatesForm()
    return render_template('index.html', form=cord_form)


@app.route('/route', methods=['POST'])
def route():
    data = request.get_json()
    start_coords = (data['start_lat'], data['start_lon'])
    end_coords = (data['end_lat'], data['end_lon'])

    api_key = "73aa3aa2-b205-461e-b88d-1727f0410895"
    graphhopper_url = f"https://graphhopper.com/api/1/route?point={start_coords[0]},{start_coords[1]}&point={end_coords[0]},{end_coords[1]}&vehicle=bike&locale=pl&key={api_key}&points_encoded=false"
    response = requests.get(graphhopper_url)
    data = response.json()

    if response.status_code == 200 and 'paths' in data:
        route = data['paths'][0]['points']['coordinates']
        route_coords = [[lat, lon] for lon, lat in route]
        return jsonify({'route': route_coords})
    else:
        return jsonify({'error': 'Error fetching route data'}), response.status_code