from app import app
from flask import render_template, request, jsonify
from forms import DirectionsForm
import requests
from functionalities import geocode, find_n_nearest_stations
from app.models import Stations


@app.route('/', methods=['GET', 'POST'])
def index():
    cord_form = DirectionsForm()
    return render_template('index.html', form=cord_form)


@app.route('/route', methods=['POST'])
def route():
    data = request.get_json()
    start_point = data['start_point']
    end_point = data['end_point']

    start_coords = geocode(start_point)
    end_coords = geocode(end_point)

    nearest_stations_start = find_n_nearest_stations(start_coords, 1)
    nearest_stations_finish = find_n_nearest_stations(end_coords, 1)
    start_station = Stations.query.filter_by(station_name=nearest_stations_start[0][0]).first()
    end_station = Stations.query.filter_by(station_name=nearest_stations_finish[0][0]).first()

    api_key = "73aa3aa2-b205-461e-b88d-1727f0410895"
    graphhopper_url = f"https://graphhopper.com/api/1/route?point={start_station.station_lat},{start_station.station_len}&point={end_station.station_lat},{end_station.station_len}&vehicle=bike&locale=pl&key={api_key}&points_encoded=false"
    response = requests.get(graphhopper_url)
    data = response.json()

    if response.status_code == 200 and 'paths' in data:
        route = data['paths'][0]['points']['coordinates']
        route_coords = [[lat, lon] for lon, lat in route]
        return jsonify({'route': route_coords, 'start_coords': start_coords, 'end_coords': end_coords})
    else:
        return jsonify({'error': 'Error fetching route data'}), response.status_code