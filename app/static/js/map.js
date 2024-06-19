document.addEventListener('DOMContentLoaded', function () {

    var map = L.map('map', { zoomControl: false }).setView(wroclawCoordinates, 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    L.control.zoom({
        position: 'bottomleft'
    }).addTo(map);
        var southWest = L.latLng(southWestCoords[0],southWestCoords[1]); // Approx. southwest corner
        var northEast = L.latLng(northEastCoords[0],northEastCoords[1]); // Approx. northeast corner
        var bounds = L.latLngBounds(southWest, northEast);

            // Set the map boundaries
        map.setMaxBounds(bounds);


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
    var routeInfo = document.getElementById('route-info');
    var lastUpdateInput = document.getElementById('last-update');
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
                        clearPathAndStationMarkers();
                        clearRouteInfo();
                        map.removeLayer(startLocationMarker);
                        startLocationMarker = null;
                    }
                    if(check_if_fits_map(lat,lon)){
                        startLocationMarker = L.marker([lat, lon], {icon: defaultStartLocationIcon}).addTo(map).on('click', function(e) {
                        map.removeLayer(startLocationMarker);
                        startLocationMarker = null;
                    });
                    }

                } else {
                    if (endLocationMarker) {
                        map.removeLayer(endLocationMarker);
                        endLocationMarker = null;
                        clearPathAndStationMarkers();
                        clearRouteInfo();
                    }
                    if(check_if_fits_map(lat,lon)) {
                        endLocationMarker = L.marker([lat, lon], {icon: defaultEndLocationIcon}).addTo(map).on('click', function(e) {
                        map.removeLayer(endLocationMarker);
                        endLocationMarker = null;

                    });
                    }

                }
            });

            container.appendChild(row);
        });

        container.style.display = 'block';
    }

    function hideSuggestions(container) {
        container.style.display = 'none';
        container.innerHTML = '';
    }

    startAddressInput.addEventListener('input', function () {
        fetchAddressHints(startAddressInput, startAddressHints, true);
    });

    endAddressInput.addEventListener('input', function () {
        fetchAddressHints(endAddressInput, endAddressHints, false);
    });

    clearButton.addEventListener("click", function() {
        clearPathAndStationMarkers();
        clearRouteInfo();
        clearLocationMarkers();
        startAddressInput.value="";
        endAddressInput.value="";
        hideSuggestions(startAddressHints);
        hideSuggestions(endAddressHints);


    });

    searchButton.addEventListener('click', function() {
        handleSearch();
        if (startStationMarker && endStationMarker) {
                 handleSubmit();
             }
    });

    clearStartButton.addEventListener("click", function() {
        startAddressInput.value = "";
        hideSuggestions(startAddressHints);
        if (startLocationMarker) {
            map.removeLayer(startLocationMarker);
            startLocationMarker = null;
            clearPathAndStationMarkers();
            clearRouteInfo();


        }
    });

    clearEndButton.addEventListener("click", function() {
        endAddressInput.value = "";
        hideSuggestions(endAddressHints);
        if (endLocationMarker) {
            map.removeLayer(endLocationMarker);
            endLocationMarker = null;
            clearPathAndStationMarkers();
            clearRouteInfo();

        }
    });

    function handleSearch() {
    var startPoint = startAddressInput.value;
    var endPoint = endAddressInput.value;

    if (startPoint === "" || endPoint === "") {
        alert("Please provide addresses.");
        console.log("Please provide addresses.");
        return;
    }

    fetchNearestStations(startPoint, endPoint)
        .then(data => {
            if (data.error) {
                alert(data.error);
                throw new Error(data.error);
            }


            clearPathAndStationMarkers();
            clearRouteInfo();


            data.start_stations.forEach(station => {
                lat = station.station_lat;
                lon = station.station_lng;

                if(check_if_fits_map(lat,lon)){
                    var marker = L.marker([station.station_lat, station.station_lng], {icon: defaultStartStationIcon})
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
                        startStationMarker = L.marker([station.station_lat, station.station_lng], {icon: chosenStartStationIcon})
                            .addTo(map)
                            .bindPopup(`Start Station: ${station.station_name}<br>Bikes Available: ${station.bikes_available}`)
                            .on('mouseover', function () {
                                marker.openPopup();
                            })
                            .on('mouseout', function () {
                                marker.closePopup();
                            });
                        checkMarkers();
                    });
                stationMarkers.push(marker);
            }
                });



            data.end_stations.forEach(station => {
                lat = station.station_lat;
                lon = station.station_lng;
                if(check_if_fits_map(lat,lon)){
                    var marker = L.marker([station.station_lat, station.station_lng], {icon: defaultEndStationIcon})
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
                        endStationMarker = L.marker([station.station_lat, station.station_lng], {icon: chosenEndStationIcon})
                            .addTo(map)
                            .bindPopup(`End Station: ${station.station_name}<br>Bikes Available: ${station.bikes_available}`)
                            .on('mouseover', function () {
                                marker.openPopup();
                            })
                            .on('mouseout', function () {
                                marker.closePopup();
                            });
                        checkMarkers();
                    });
                stationMarkers.push(marker);
                }

            });

            // Fetch closest start station
            findMinDistance(data.start_stations, [startLocationMarker.getLatLng().lat, startLocationMarker.getLatLng().lng])
                .then(start_closest_station => {
                    console.log('Closest start station:', start_closest_station);
                    startStationMarker = L.marker([start_closest_station.station_lat, start_closest_station.station_lng], {icon: chosenStartStationIcon})
                        .addTo(map)
                        .bindPopup(`Start Station: ${start_closest_station.station_name}<br>Bikes Available: ${start_closest_station.bikes_available}`)
                        .on('mouseover', function () {
                            startStationMarker.openPopup();
                        })
                        .on('mouseout', function () {
                            startStationMarker.closePopup();
                        });


                    checkMarkers();
                })
                .catch(error => {
                    console.error('Error fetching closest start station:', error);
                    throw error;
                });

            // Fetch closest end station
            findMinDistance(data.end_stations, [endLocationMarker.getLatLng().lat, endLocationMarker.getLatLng().lng])
                .then(end_closest_station => {
                    console.log('Closest end station:', end_closest_station);
                    endStationMarker = L.marker([end_closest_station.station_lat, end_closest_station.station_lng], {icon: chosenEndStationIcon})
                        .addTo(map)
                        .bindPopup(`End Station: ${end_closest_station.station_name}<br>Bikes Available: ${end_closest_station.bikes_available}`)
                        .on('mouseover', function () {
                            endStationMarker.openPopup();
                        })
                        .on('mouseout', function () {
                            endStationMarker.closePopup();
                        });

                    checkMarkers();
                })
                .catch(error => {
                    console.error('Error fetching closest end station:', error);
                    throw error;
                });
        })
        .catch(error => {
            console.error('Error fetching data or handling form submission:', error);
            alert('Error fetching data or handling form submission. Please try again.');
        });

}

function fetchNearestStations(startPoint, endPoint) {
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
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .catch(error => {
        console.error('Error fetching nearest stations:', error);
        throw error; // Re-throw the error to propagate it to the next catch block
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
                addRouteInfo(from_start_to_start_station_dict, from_start_station_to_end_station_dict, from_end_station_to_end_dict)
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
    polyline.bindPopup(popupContent, { autoClose: false }).on('mouseover', function () {
                            polyline.openPopup();
                        })
                        .on('mouseout', function () {
                            polyline.closePopup();
                        });
}

   function addRouteInfo(route_data_start, route_data_cycle, route_data_end) {
        var totalTime = route_data_start.time + route_data_cycle.time + route_data_end.time;
        totalTime = (totalTime / 1000);
        totalTime = Math.floor(totalTime / 60);
        var totalDistance = route_data_cycle.distance + route_data_end.distance + route_data_start.distance;
        totalDistance = totalDistance / 1000
        var popupContent = `Time: ${totalTime} minutes <br>Distance: ${totalDistance.toFixed(2)} km`;

        routeInfo.innerHTML = popupContent;
   }



    function clearPathAndStationMarkers() {
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
    function clearLocationMarkers() {
        if (startLocationMarker) {
            map.removeLayer(startLocationMarker);
            startLocationMarker = null;
        }
        if (endLocationMarker) {
            map.removeLayer(endLocationMarker);
            endLocationMarker = null;
        }
    }

    function clearRouteInfo() {
        routeInfo.innerHTML="";
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

    function findMinDistance(jsonList,point) {
        return fetch_best_station(jsonList, point)
        .then(closestObject => {
            console.log(closestObject); // Log the closestObject JSON data
            return closestObject; // Return the JSON object directly
        })
        .catch(error => {
            console.error('Error fetching closest station:', error);
            // Handle error appropriately if needed
            return null; // or throw error
        });
    }

    function onMapClick(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        if (!startLocationMarker && check_if_fits_map(lat,lng)) {

            startLocationMarker = L.marker([lat, lng], {icon: defaultStartLocationIcon}).addTo(map)
                .on('click', function () {
                    map.removeLayer(startLocationMarker);
                    startLocationMarker = null;
                    clearPathAndStationMarkers();
                    clearRouteInfo();
                    startAddressInput.value = "";
                });

            fetch_geocode(lat, lng)
                .then(display_name => {
                    startAddressInput.value = display_name;
                })
                .catch(error => {
                    console.error('Error fetching geocode:', error);
                });
        } else if (!endLocationMarker && check_if_fits_map(lat,lng)) {

            endLocationMarker = L.marker([lat, lng], {icon: defaultEndLocationIcon}).addTo(map)
                .on('click', function () {
                    map.removeLayer(endLocationMarker);
                    endLocationMarker = null;
                    clearPathAndStationMarkers();
                    clearRouteInfo();
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
    function fetch_best_station(list_of_stations,point){
        return fetch('/best_station', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                list_of_stations: list_of_stations,
                lat: point[0],
                lon: point[1]
            })
        }).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            } else {
                return data.best_station;
            }
        });
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

    function check_if_fits_map(lat,lon) {
        minlat = wroclawCityBounds[0]
        maxlat = wroclawCityBounds[1]
        minlon = wroclawCityBounds[2]
        maxlon = wroclawCityBounds[3]
        console.log(minlat,maxlat,minlon,maxlon)
        if (minlat <= lat && lat <= maxlat && minlon <= lon && lon <= maxlon){
            console.log(lat,lon);
            return true;
        } else{
            alert("That point doesn't fit the bounds.")
            return false;
        }

    }

});
