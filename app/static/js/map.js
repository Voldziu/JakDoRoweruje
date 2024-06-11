
document.addEventListener('DOMContentLoaded', function () {
    var map = L.map('map', {zoomControl: false}).setView([51.1097, 17.0316], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    L.control.zoom({
        position: 'bottomleft'
    }).addTo(map);

    var form = document.getElementById('coords_form');
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var start_point = form.elements['start_point'].value;
        var end_point = form.elements['end_point'].value;


        fetch('/route', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                start_point: start_point,
                end_point: end_point
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
            } else {
                var route = data.route;
                var start_coords = data.start_coords
                var end_coords = data.end_coords

                // Clear previous layers
                map.eachLayer(function (layer) {
                    if (layer instanceof L.Marker || layer instanceof L.Polyline) {
                        map.removeLayer(layer);
                    }
                });

                L.marker([start_coords[0], start_coords[1]], {icon: L.icon({iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png'})}).addTo(map).bindPopup('Start').openPopup();
                L.marker([end_coords[0], end_coords[1]], {icon: L.icon({iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-red.png'})}).addTo(map).bindPopup('End').openPopup();
                L.polyline(route, {color: 'blue'}).addTo(map);
                map.fitBounds(route);
            }
        });
    });
});
