import Constants
from app import app
from flask import render_template, request, jsonify
from forms import DirectionsForm
import requests
from functionalities import get_nearest_stations,route_from_a_to_b
from app.models import Stations


@app.route('/', methods=['GET', 'POST'])
def index():
    cord_form = DirectionsForm()
    return render_template('index.html', form=cord_form)

@app.route('/nearest_stations', methods=['POST'])
def nearest_stations():
    data = request.get_json()
    print(data)
    start_point = data['start_point']
    end_point = data['end_point']
    print(start_point)
    print(end_point)

    nearest_stations = get_nearest_stations(start_point, end_point)
    print(nearest_stations)
    return jsonify(nearest_stations)


@app.route('/route', methods=['POST'])
def route():
    data = request.get_json()
    start_coords_station = data['start_coords_station']
    end_coords_station = data['end_coords_station']
    start_coords = data['start_coords']
    end_coords = data['end_coords']

    from_start_to_start_station_dict= route_from_a_to_b(start_coords,start_coords_station,"foot")
    from_start_station_to_end_station_dict = route_from_a_to_b(start_coords_station,end_coords_station,"bike")
    from_end_station_to_end_dict = route_from_a_to_b(end_coords_station, end_coords, "foot")
    return jsonify({
        "from_start_to_start_station_dict": from_start_to_start_station_dict,
        "from_start_station_to_end_station_dict":from_start_station_to_end_station_dict,
        "from_end_station_to_end_dict": from_end_station_to_end_dict

    })




@app.route('/suggestions', methods=["POST"])
def suggestions():
    data = request.get_json()
    query = data.get('query', '')
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


    #print(suggestions)

    return jsonify(suggestions_raw =data)
