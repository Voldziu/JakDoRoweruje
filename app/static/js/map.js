document.addEventListener('DOMContentLoaded', function () {
    var map = L.map('map', { zoomControl: false }).setView(WroclawCoordinates, 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    L.control.zoom({
        position: 'bottomleft'
    }).addTo(map);


    // Function to fetch address hints from OpenStreetMap Nominatim API
    function fetchAddressHints(input, container) {
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
                   // console.log("Suggestions data:", data);  // Debug print
                    displaySuggestions(container, data.suggestions, input);
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
    function displaySuggestions(container, suggestions, input) {
    // Clear previous suggestions
    container.innerHTML = '';


    suggestions.forEach(function (address) {
        // here we can process address a bit

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
        });

        // Append row to table
        container.appendChild(row);
    });

    // Append table to container
    container.style.display = 'block';
}

    function hideSuggestions(container) {
    // Hide the suggestions table
    container.style.display = 'none';
}

    var startMarker, endMarker;
    var stationMarkers = [];
    var form = document.getElementById('coords_form');
    // var startAddressInput = document.getElementById('start-address');
    // var endAddressInput = document.getElementById('end-address');
    var startAddressInput = form.elements['start_point'];
    var endAddressInput = form.elements['end_point'];
    var searchButton = document.getElementById('search_button');
    var findRouteButton = document.getElementById('find_route_button');
    // Address autocomplete for start and end points

    var startAddressHints = document.getElementById('address-hints-start');
    var endAddressHints = document.getElementById('address-hints-end');

    startAddressInput.addEventListener('input', function () {
        fetchAddressHints(startAddressInput, startAddressHints);
    });

    endAddressInput.addEventListener('input', function () {
        fetchAddressHints(endAddressInput, endAddressHints);
    });



    searchButton.addEventListener('click', function (e) {
        var startPoint = form.elements['start_point'].value;
        var endPoint = form.elements['end_point'].value;

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
                    var marker = L.marker([station.station_lat, station.station_lng]).addTo(map)
                        .bindPopup(`Start Station: ${station.station_name}`)
                        .on('click', function () {
                            if (startMarker) {
                                map.removeLayer(startMarker);
                            }
                            startMarker = L.marker([station.station_lat, station.station_lng], {icon: L.icon({iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png'})}).addTo(map).bindPopup('Start').openPopup();
                            checkMarkers();
                        });
                    stationMarkers.push(marker);
                });

                data.end_stations.forEach(station => {
                    var marker = L.marker([station.station_lat, station.station_lng]).addTo(map)
                        .bindPopup(`End Station: ${station.station_name}`)
                        .on('click', function () {
                            if (endMarker) {
                                map.removeLayer(endMarker);
                            }
                            endMarker = L.marker([station.station_lat, station.station_lng], {icon: L.icon({iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-red.png'})}).addTo(map).bindPopup('End').openPopup();
                            checkMarkers();
                        });
                    stationMarkers.push(marker);
                });
            }
        });
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();


        var start_point = startAddressInput.value;
        var end_point = endAddressInput.value;

        if (!startMarker || !endMarker) {
            alert("Please select both start and end stations.");
            return;
        }

        var start_coords = [startMarker.getLatLng().lat, startMarker.getLatLng().lng];
        var end_coords = [endMarker.getLatLng().lat, endMarker.getLatLng().lng];


        fetch('/route', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                start_coords: start_coords,
                end_coords: end_coords
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    var route = data.route;
                    var start_coords = data.start_coords;
                    var end_coords = data.end_coords;

                    // Clear previous layers
                    map.eachLayer(function (layer) {
                        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
                            map.removeLayer(layer);
                        }
                    });
                    clearMarkers();

                     startMarker = L.marker([start_coords[0], start_coords[1]], {icon: L.icon({iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png'})}).addTo(map).bindPopup('Start').openPopup();
                    endMarker = L.marker([end_coords[0], end_coords[1]], {icon: L.icon({iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-red.png'})}).addTo(map).bindPopup('End').openPopup();
                    L.polyline(route, {color: 'blue'}).addTo(map);
                    map.fitBounds(route);


                }
            });
    });




    function clearMarkers() {
        stationMarkers.forEach(marker => map.removeLayer(marker));
        stationMarkers = [];
    }

    function checkMarkers() {
        if (startMarker && endMarker) {
            findRouteButton.style.display = 'block';
        } else {
            findRouteButton.style.display = 'none';
        }
    }
});

