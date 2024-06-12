import requests
import re

def geocode(address):
    url = 'https://nominatim.openstreetmap.org/search'
    processed_addres = process_addres(address)
    params = {
        'q': processed_addres,
        'format': 'json',
        'limit': 1
    }
    headers = {
        'User-Agent': 'YourAppName/1.0 (your-email@example.com)'
    }
    response = requests.get(url, params=params, headers=headers)
    response.raise_for_status()
    data = response.json()
    if data:
        return [float(data[0]['lat']), float(data[0]['lon'])]
    else:
        return None



def process_addres(address):
    print(address)
    if re.search(r', Wrocław$', address):
        print("String ends with ', Wrocław'")
    else:
        print("String does not end with ', Wrocław'")
    return address