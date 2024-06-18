from app import app
from flask import render_template, request, jsonify
from forms import DirectionsForm
import requests
from functionalities import get_nearest_stations, route_from_a_to_b, reverse_geocode
from constants import CityName as cityname



@app.route('/', methods=['GET', 'POST'])
def index():
    cord_form = DirectionsForm()
    return render_template('index.html', form=cord_form)


@app.route('/nearest_stations', methods=['POST'])
def nearest_stations():
    data = request.get_json()
    start_point = data['start_point']
    end_point = data['end_point']
   
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
    print(start_coords)

    from_start_to_start_station_dict = route_from_a_to_b(start_coords, start_coords_station, "foot")
    from_start_station_to_end_station_dict = route_from_a_to_b(start_coords_station, end_coords_station, "bike")
    from_end_station_to_end_dict = route_from_a_to_b(end_coords_station, end_coords, "foot")
    return jsonify({
        "from_start_to_start_station_dict": from_start_to_start_station_dict,
        "from_start_station_to_end_station_dict": from_start_station_to_end_station_dict,
        "from_end_station_to_end_dict": from_end_station_to_end_dict
    })


@app.route('/suggestions', methods=["POST"])
def suggestions():
    data = request.get_json()
    query = data.get('query', '')
    if query:
        url = 'https://nominatim.openstreetmap.org/search'
        params = {
            'q': query + "," + cityname,
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

    return jsonify(suggestions_raw=data)


@app.route('/geocode', methods=["POST"])
def geocode():
    data = request.get_json()
    lat = data['lat']
    lng = data['lng']
    display_name = reverse_geocode(lat, lng)
    return jsonify(display_name=display_name)

@app.route('/best_station' , methods=["POST"])
def find_closest_station():
    data = request.get_json()
    print(data)
    list_of_stations = data['list_of_stations']
    location_lat = data['lat']
    location_lon = data['lon']
    MinTime = 100000000
    MinStation=None
    for station in list_of_stations:
        print(station)
        dict = route_from_a_to_b([location_lat,location_lon],[station['station_lat'],station['station_lng']],'foot')
        print(dict)
        time = dict['time']
        if(time<MinTime):
            MinTime=time
            MinStation=station
    return jsonify(best_station = MinStation)





