import requests

url = 'https://api.nextbike.net/maps/nextbike-live.json'
params = {
    'city': 148
}

response = requests.get(url, params=params)
if response.status_code == 200:
    data = response.json()
    if 'countries' in data and data['countries']:
        wroclaw_data = data['countries'][0]['cities'][0]['places']
        for place in wroclaw_data:
            print(f"Stacja: {place['name']}, Rowerów dostępnych: {place['bikes']}, Adres: {place.get('address', 'Brak adresu')}")
    else:
        print("Brak danych dla podanego miasta.")
else:
    print(f"Błąd: {response.status_code}")
