document.addEventListener('DOMContentLoaded', function () {
    var map = L.map('map', {zoomControl: false}).setView([51.1097, 17.0316], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    L.control.zoom({
        position: 'bottomleft'
    }).addTo(map);

    var startMarker, endMarker;
    var stationMarkers = [];

    var form = document.getElementById('coords_form');
    var searchButton = document.getElementById('search_button');
    var findRouteButton = document.getElementById('find_route_button');

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
