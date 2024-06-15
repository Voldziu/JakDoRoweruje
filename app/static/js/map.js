document.addEventListener('DOMContentLoaded', function () {
    var map = L.map('map', { zoomControl: false }).setView(WroclawCoordinates, 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    L.control.zoom({
        position: 'bottomleft'
    }).addTo(map);

    var startStationMarker, endStationMarker;
    var startLocationMarker, endLocationMarker;
    var stationMarkers = [];
    var form = document.getElementById('coords_form');
    var startAddressInput = document.getElementById('start-address');
    var endAddressInput = document.getElementById('end-address');
    var searchButton = document.getElementById('search_button');
    var clearButton = document.getElementById('clear_button');
    // var findRouteButton = document.getElementById('find_route_button');
    // Address autocomplete for start and end points

    var startAddressHints = document.getElementById('address-hints-start');
    var endAddressHints = document.getElementById('address-hints-end');
    // Function to fetch address hints from OpenStreetMap Nominatim API
    function fetchAddressHints(input, container,start) {
       // console.log(50);
        var value = input.value;

        if (value.length > 2) {
           // console.log(value);
            clearTimeout(input.timer);

        // Set a new timer to fetch suggestions after 500 milliseconds (0.5 seconds)
        input.timer = setTimeout(function() {

            fetch('/suggestions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ query: value })
                })
                .then(response => {
                   // console.log("Response status:", response.status);  // Debug print
                    return response.json();
                })
                .then(data => {
                   console.log("Suggestions data:", data.suggestions_raw);  // Debug print

                    displaySuggestions(container, data.suggestions_raw, input,start);
                })
                .catch(error => {
                    //console.error('Error fetching address hints:', error);
                });
            }, 500);
    } else {
        hideSuggestions(container);
        clearTimeout(input.timer);
        }
    }

    // Function to display address hints
    function displaySuggestions(container, suggestions_raw, input, start) {
    // Clear previous suggestions
    container.innerHTML = '';

    suggestions_raw.forEach(function (suggestion_json) {
        // here we can process address a bit
        var address = suggestion_json.display_name;

        // Create table row
        var row = document.createElement('tr');
        row.classList.add('address-suggestion');

        // Create table cell for the address
        var cell = document.createElement('td');
        cell.textContent = address;
        row.appendChild(cell);

        // Add click event listener to populate input field with the selected address
        row.addEventListener('click', function () {
            container.innerHTML = ''; // Clear suggestions
            input.value = address; // Populate input field
            var lat = suggestion_json.lat;
            var lon = suggestion_json.lon;

            if (start) {
                if (startLocationMarker) {
                    clearMarkers();
                    map.removeLayer(startLocationMarker);
                    startLocationMarker = null;
                }
                startLocationMarker = L.marker([lat, lon], {icon: L.icon({iconUrl: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'})}).addTo(map);
            } else {
                if (endLocationMarker) {
                    clearMarkers();
                    map.removeLayer(endLocationMarker);
                    endLocationMarker = null;
                }
                endLocationMarker = L.marker([lat, lon], {icon: L.icon({iconUrl: 'http://maps.google.com/mapfiles/ms/icons/pink-dot.png'})}).addTo(map);
            }
            checkLocationMarkers();

        });

        // Append row to table
        container.appendChild(row);
    });

    // Display the container with suggestions
    container.style.display = 'block';

}





    function hideSuggestions(container) {
    // Hide the suggestions table
    container.style.display = 'none';
}



    startAddressInput.addEventListener('input', function () {
        fetchAddressHints(startAddressInput, startAddressHints,true);

    });

    endAddressInput.addEventListener('input', function () {
        fetchAddressHints(endAddressInput, endAddressHints,false);
    });

    clearButton.addEventListener("click",clearMarkers);

    function handleSearch() {
    var startPoint = startAddressInput.value;
    var endPoint = endAddressInput.value;

    fetch('/nearest_stations', {
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
                var marker = L.marker([station.station_lat, station.station_lng], {icon: L.icon({iconUrl: 'http://maps.google.com/mapfiles/ms/icons/ltblue-dot.png'})}).addTo(map)
                    .bindPopup(`Start Station: ${station.station_name}`)
                    .on('click', function () {
                        if (startStationMarker) {
                            map.removeLayer(startStationMarker);
                        }
                        startStationMarker = L.marker([station.station_lat, station.station_lng], {icon: L.icon({iconUrl: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'})}).addTo(map).bindPopup('Start').openPopup();
                        checkMarkers();
                    });
                stationMarkers.push(marker);

            });

            data.end_stations.forEach(station => {
                var marker = L.marker([station.station_lat, station.station_lng], {icon: L.icon({iconUrl: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png'})}).addTo(map)
                    .bindPopup(`End Station: ${station.station_name}`)
                    .on('click', function () {
                        if (endStationMarker) {
                            map.removeLayer(endStationMarker);
                        }
                        endStationMarker = L.marker([station.station_lat, station.station_lng], {icon: L.icon({iconUrl: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'})}).addTo(map).bindPopup('End').openPopup();
                        checkMarkers();
                    });
                stationMarkers.push(marker);

            });
            console.log(data.start_stations);
            route_best_stations(data.start_stations,data.end_stations);
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
                console.log(from_start_to_start_station_dict);

                //Clear previous layers
                clearPath();
                // clearMarkers();


                L.polyline(from_start_to_start_station_dict.route, {color: 'red'}).addTo(map);
                L.polyline(from_start_station_to_end_station_dict.route, {color: 'blue'}).addTo(map);
                L.polyline(from_end_station_to_end_dict.route, {color: 'red'}).addTo(map);
                //map.fitBounds(from_start_station_to_end_station_dict.route);
            }
        });
    }

    // Link the function to the form's submit event listener

// Add event listener to the search button
    searchButton.addEventListener('click', handleSearch);


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
    }}

    function route_best_stations(start_stations,end_stations) {
        start_closest_station = findMinDistance(start_stations);
        end_closest_station = findMinDistance(end_stations);
        console.log(start_closest_station);
        startStationMarker = L.marker([start_closest_station.station_lat, start_closest_station.station_lng], {icon: L.icon({iconUrl: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'})}).addTo(map).bindPopup('Start').openPopup();
        endStationMarker = L.marker([end_closest_station.station_lat, end_closest_station.station_lng], {icon: L.icon({iconUrl: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'})}).addTo(map).bindPopup('End').openPopup();
        handleSubmit();
    }

    function checkLocationMarkers(){
        if (startLocationMarker && endLocationMarker) {
            handleSearch();

    }}
    function clearPath(){
        map.eachLayer(function (layer) {
                    if (layer instanceof L.Polyline) {
                        map.removeLayer(layer);
                    }
                });
    }
    function findMinDistance(jsonList) {
        console.log(jsonList);
    if (jsonList.length === 0) {
        return null; // Return null if the list is empty
    }

    // Initialize variables to track the minimum distance and corresponding object
    let minDistance = Infinity;
    let closestObject = null;

    // Iterate through each JSON object in the list
    jsonList.forEach(obj => {
        // Compare current object's distance with the minimum distance found so far
        if (obj.distance < minDistance) {
            minDistance = obj.distance;
            closestObject = obj;
        }
    });

    // Return the closest object with minimal distance
    return closestObject;
}
});

