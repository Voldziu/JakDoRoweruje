document.addEventListener('DOMContentLoaded', function () {
    var map = L.map('map').setView([51.1097, 17.0316], 14);  // Centered in Wrocław

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    var form = document.getElementById('coords_form');
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var startLat = parseFloat(form.elements['start_lat'].value);
        var startLon = parseFloat(form.elements['start_lon'].value);
        var endLat = parseFloat(form.elements['end_lat'].value);
        var endLon = parseFloat(form.elements['end_lon'].value);

        fetch('/route', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                start_lat: startLat,
                start_lon: startLon,
                end_lat: endLat,
                end_lon: endLon
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                var route = data.route;

                // Clear previous layers
                map.eachLayer(function (layer) {
                    if (layer instanceof L.Marker || layer instanceof L.Polyline) {
                        map.removeLayer(layer);
                    }
                });

                L.marker([startLat, startLon], {icon: L.icon({iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png'})}).addTo(map).bindPopup('Start').openPopup();
                L.marker([endLat, endLon], {icon: L.icon({iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-red.png'})}).addTo(map).bindPopup('End').openPopup();
                L.polyline(route, {color: 'blue'}).addTo(map);
                map.fitBounds(route);
            }
        });
    });
});
