document.addEventListener('DOMContentLoaded', function () {
    var map = L.map('map', { zoomControl: false }).setView(WroclawCoordinates, 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    L.control.zoom({
        position: 'bottomleft'
    }).addTo(map);

    map.on('click', onMapClick);

    var startStationMarker, endStationMarker;
    var startLocationMarker, endLocationMarker;
    var stationMarkers = [];
    var startAddressInput = document.getElementById('start-address');
    var endAddressInput = document.getElementById('end-address');
    var searchButton = document.getElementById('search_button');
    var clearButton = document.getElementById('clear_button');
    var clearStartButton = document.getElementById('clear_start_button');
    var clearEndButton = document.getElementById('clear_end_button');

    var startAddressHints = document.getElementById('address-hints-start');
    var endAddressHints = document.getElementById('address-hints-end');

    function fetchAddressHints(input, container, start) {
        var value = input.value;

        if (value.length > 2) {
            clearTimeout(input.timer);

            input.timer = setTimeout(function() {
                fetch('/suggestions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ query: value })
                })
                .then(response => response.json())
                .then(data => {
                    displaySuggestions(container, data.suggestions_raw, input, start);
                })
                .catch(error => {
                    console.error('Error fetching address hints:', error);
                });
            }, 500);
        } else {
            hideSuggestions(container);
            clearTimeout(input.timer);
        }
    }

    function displaySuggestions(container, suggestions_raw, input, start) {
        container.innerHTML = '';

        suggestions_raw.forEach(function (suggestion_json) {
            var address = suggestion_json.display_name;

            var row = document.createElement('tr');
            row.classList.add('address-suggestion');

            var cell = document.createElement('td');
            cell.textContent = address;
            row.appendChild(cell);

            row.addEventListener('click', function () {
                container.innerHTML = '';
                input.value = address;
                var lat = suggestion_json.lat;
                var lon = suggestion_json.lon;

                if (start) {
                    if (startLocationMarker) {
                        clearMarkers();
                        map.removeLayer(startLocationMarker);
                        startLocationMarker = null;
                    }
                    startLocationMarker = L.marker([lat, lon], {icon: L.icon({iconUrl: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'})}).addTo(map).on('click', function(e) {
                        map.removeLayer(startLocationMarker);
                        startLocationMarker = null;
                    });
                } else {
                    if (endLocationMarker) {
                        map.removeLayer(endLocationMarker);
                        endLocationMarker = null;
                        clearMarkers();
                    }
                    endLocationMarker = L.marker([lat, lon], {icon: L.icon({iconUrl: 'http://maps.google.com/mapfiles/ms/icons/pink-dot.png'})}).addTo(map).on('click', function(e) {
                        map.removeLayer(endLocationMarker);
                        endLocationMarker = null;
                        clearMarkers();
                    });
                }
            });

            container.appendChild(row);
        });

        container.style.display = 'block';
    }

    function hideSuggestions(container) {
        container.style.display = 'none';
    }

    startAddressInput.addEventListener('input', function () {
        fetchAddressHints(startAddressInput, startAddressHints, true);
    });

    endAddressInput.addEventListener('input', function () {
        fetchAddressHints(endAddressInput, endAddressHints, false);
    });

    clearButton.addEventListener("click", clearMarkers);

    searchButton.addEventListener('click', function() {
        handleSearch().then(() => {
            if (startStationMarker && endStationMarker) {
                handleSubmit();
            }
        });
    });

    clearStartButton.addEventListener("click", function() {
        startAddressInput.value = "";
        if (startLocationMarker) {
            map.removeLayer(startLocationMarker);
            startLocationMarker = null;
            clearMarkers();
        }
    });

    clearEndButton.addEventListener("click", function() {
        endAddressInput.value = "";
        if (endLocationMarker) {
            map.removeLayer(endLocationMarker);
            endLocationMarker = null;
            clearMarkers();
        }
    });

    function handleSearch() {
    var startPoint = startAddressInput.value;
    var endPoint = endAddressInput.value;

    return fetch('/nearest_stations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            start_point: startPoint,
            end_point: endPoint
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            clearMarkers();

            data.start_stations.forEach(station => {
                var marker = L.marker([station.station_lat, station.station_lng], {icon: L.icon({iconUrl: 'http://maps.google.com/mapfiles/ms/icons/ltblue-dot.png'})})
                    .addTo(map)
                    .bindPopup(`Start Station: ${station.station_name}<br>Bikes Available: ${station.bikes_available}`)
                    .on('mouseover', function () {
                        marker.openPopup();
                    })
                    .on('mouseout', function () {
                    marker.closePopup();
                    })
                    .on('click', function () {
                        if (startStationMarker) {
                            map.removeLayer(startStationMarker);
                        }
                        startStationMarker = L.marker([station.station_lat, station.station_lng], {icon: L.icon({iconUrl: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'})})
                            .addTo(map);
                        checkMarkers();
                    });
                stationMarkers.push(marker);
            });

            data.end_stations.forEach(station => {
                var marker = L.marker([station.station_lat, station.station_lng], {icon: L.icon({iconUrl: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png'})})
                    .addTo(map)
                    .bindPopup(`End Station: ${station.station_name}<br>Bikes Available: ${station.bikes_available}`)
                    .on('mouseover', function () {
                        marker.openPopup();
                    })
                    .on('mouseout', function () {
                    marker.closePopup();
                    })
                    .on('click', function () {
                        if (endStationMarker) {
                            map.removeLayer(endStationMarker);
                        }
                        endStationMarker = L.marker([station.station_lat, station.station_lng], {icon: L.icon({iconUrl: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'})})
                            .addTo(map);
                        checkMarkers();
                    });
                stationMarkers.push(marker);
            });

            var start_closest_station = findMinDistance(data.start_stations);
            var end_closest_station = findMinDistance(data.end_stations);
            startStationMarker = L.marker([start_closest_station.station_lat, start_closest_station.station_lng], {icon: L.icon({iconUrl: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'})})
                .addTo(map)

            endStationMarker = L.marker([end_closest_station.station_lat, end_closest_station.station_lng], {icon: L.icon({iconUrl: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'})})
                .addTo(map)

            handleSubmit();
        }
    })
    .catch(error => {
        console.error('Error fetching data:', error);
        alert('Error fetching data. Please try again.');
    });
}


    function handleSubmit() {
        if (!startStationMarker || !endStationMarker) {
            alert("Please select both start and end stations.");
            return;
        }

        var start_coords = [startLocationMarker.getLatLng().lat, startLocationMarker.getLatLng().lng];
        var end_coords = [endLocationMarker.getLatLng().lat, endLocationMarker.getLatLng().lng];
        var start_coords_station = [startStationMarker.getLatLng().lat, startStationMarker.getLatLng().lng];
        var end_coords_station = [endStationMarker.getLatLng().lat, endStationMarker.getLatLng().lng];

        fetch('/route', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                start_coords: start_coords,
                end_coords: end_coords,
                start_coords_station: start_coords_station,
                end_coords_station: end_coords_station
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                var from_start_to_start_station_dict = data.from_start_to_start_station_dict;
                var from_start_station_to_end_station_dict = data.from_start_station_to_end_station_dict;
                var from_end_station_to_end_dict = data.from_end_station_to_end_dict;

                clearPath();

                var polyline1 = L.polyline(from_start_to_start_station_dict.route, {color: 'red'}).addTo(map);
                var polyline2 = L.polyline(from_start_station_to_end_station_dict.route, {color: 'blue'}).addTo(map);
                var polyline3 = L.polyline(from_end_station_to_end_dict.route, {color: 'red'}).addTo(map);
                addRoutePopup(polyline1, from_start_to_start_station_dict);
                addRoutePopup(polyline2, from_start_station_to_end_station_dict);
                addRoutePopup(polyline3, from_end_station_to_end_dict);
            }
        })
        .catch(error => {
            console.error('Error fetching route:', error);
            alert('Error fetching route. Please try again.');
        });
    }

  function addRoutePopup(polyline, routeData) {
    var totalTimeInSeconds = routeData.time / 1000;
    var minutes = Math.floor(totalTimeInSeconds / 60);
    var seconds = totalTimeInSeconds % 60;

    var totalDistance = routeData.distance / 1000;

    var popupContent = `Time: ${minutes} minutes ${seconds.toFixed(0)} seconds<br>Distance: ${totalDistance.toFixed(2)} km`;
    polyline.bindPopup(popupContent, { autoClose: false }).openPopup();
}



    function clearMarkers() {
        stationMarkers.forEach(marker => map.removeLayer(marker));
        if (startStationMarker) {
            map.removeLayer(startStationMarker);
            startStationMarker = null;
        }
        if (endStationMarker) {
            map.removeLayer(endStationMarker);
            endStationMarker = null;
        }

        clearPath();
        stationMarkers = [];
    }

    function checkMarkers() {
        if (startStationMarker && endStationMarker) {
            handleSubmit();
        }
    }

    function clearPath() {
        map.eachLayer(function (layer) {
            if (layer instanceof L.Polyline) {
                map.removeLayer(layer);
            }
        });
    }

    function findMinDistance(jsonList) {
        console.log(jsonList)
        if (jsonList.length === 0) {
            return null;
        }

        var minDistance = Infinity;
        var closestObject = null;

        jsonList.forEach(obj => {
            if (obj.distance < minDistance) {
                minDistance = obj.distance;
                closestObject = obj;
            }
        });

        return closestObject;
    }

    function onMapClick(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        if (!startLocationMarker) {
            startLocationMarker = L.marker([lat, lng], {icon: L.icon({iconUrl: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'})}).addTo(map)
                .on('click', function () {
                    map.removeLayer(startLocationMarker);
                    startLocationMarker = null;
                    clearMarkers();
                    startAddressInput.value = "";
                });

            fetch_geocode(lat, lng)
                .then(display_name => {
                    startAddressInput.value = display_name;
                })
                .catch(error => {
                    console.error('Error fetching geocode:', error);
                });
        } else if (!endLocationMarker) {
            endLocationMarker = L.marker([lat, lng], {icon: L.icon({iconUrl: 'http://maps.google.com/mapfiles/ms/icons/pink-dot.png'})}).addTo(map)
                .on('click', function () {
                    map.removeLayer(endLocationMarker);
                    endLocationMarker = null;
                    clearMarkers();
                    endAddressInput.value = "";
                });

            fetch_geocode(lat, lng)
                .then(display_name => {
                    endAddressInput.value = display_name;
                })
                .catch(error => {
                    console.error('Error fetching geocode:', error);
                });
        }
    }

    function fetch_geocode(lat, lng){
        return fetch('/geocode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                lat: lat,
                lng: lng,
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            } else {
                return data.display_name;
            }
        });
    }
});
