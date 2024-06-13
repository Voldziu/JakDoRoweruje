from geopy.distance import geodesic
import requests

import re

from app.models import Stations
from app import db, app


def update_database():
    url = 'https://api.nextbike.net/maps/nextbike-live.json'
    params = {
        'city': 148  # Wroclaw
    }

    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        #print(f'updated_database: {data}')
        if 'countries' in data and data['countries']:
            wroclaw_data = data['countries'][0]['cities'][0]['places']
            with app.app_context():
                existing_stations = {station.station_name: station for station in Stations.query.all()}
                updated_stations = set()
                for place in wroclaw_data:
                    station_name = place['name']
                    if station_name in existing_stations:
                        station = existing_stations[station_name]
                        station.available_bikes = place.get('bikes', 0)
                        #print("Updating")

                    else:
                        station = Stations(station_name=station_name, station_lat=place['lat'],
                                           station_len=place['lng'], bikes_available=place.get('bikes', 0))
                        db.session.add(station)

                    updated_stations.add(station_name)

                for name in existing_stations:
                    if name not in updated_stations:
                        db.session.delete(existing_stations[name])

                db.session.commit()

def geocode(address):
    url = 'https://nominatim.openstreetmap.org/search'

    params = {
        'q': address,
        'format': 'json',
        'limit': 1
    }
    headers = {
        'User-Agent': 'YourAppName/1.0 (m.wojciechowski2413@gmail.com)'
    }
    response = requests.get(url, params=params, headers=headers)
    response.raise_for_status()
    data = response.json()
    if data:
        return [float(data[0]['lat']), float(data[0]['lon'])]
    else:
        return None


# def process_addres(address):
#     print(address)
#     if re.search(r', Wrocław$', address):
#         print("String ends with ', Wrocław'")
#     else:
#         print("String does not end with ', Wrocław'")
#
#     return address

def find_n_nearest_stations(coords, n, end_station=False):
    stations = Stations.query.all()
    latitude = coords[0]
    longitude = coords[1]

    stations_list = []
    for station in stations:
        distance = geodesic((latitude, longitude), (station.station_lat, station.station_len)).meters
        if (end_station and station.bikes_available > 0) or (end_station == False and "BIKE" not in station.station_name):
            stations_list.append(
                (station.station_name, station.station_lat, station.station_len, station.bikes_available, distance))

    sorted_stations = sorted(stations_list, key=lambda x: x[4])
    return sorted_stations[:n]


def get_nearest_stations(start_point, end_point):
    start_coords = geocode(start_point)
    end_coords = geocode(end_point)
    print(start_coords)

    nearest_stations_start = find_n_nearest_stations(start_coords, 5)
    nearest_stations_finish = find_n_nearest_stations(end_coords, 5)

    start_stations = [
        {
            'station_name': station[0],
            'station_lat': station[1],
            'station_lng': station[2],
            'bikes_available': station[3],
            'distance': station[4]
        } for station in nearest_stations_start
    ]

    end_stations = [
        {
            'station_name': station[0],
            'station_lat': station[1],
            'station_lng': station[2],
            'bikes_available': station[3],
            'distance': station[4]
        } for station in nearest_stations_finish
    ]

    return {'start_stations': start_stations, 'end_stations': end_stations}

