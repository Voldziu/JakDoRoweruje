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
        var value = input.value;
        if (value.length > 2) {
            clearTimeout(input.timer);

        // Set a new timer to fetch suggestions after 500 milliseconds (0.5 seconds)
        input.timer = setTimeout(function() {
            var url = `https://nominatim.openstreetmap.org/search?q=${value}&format=json&addressdetails=1&limit=5`;
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    displaySuggestions(container, data, input);
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

    // Function to display address hints
    function displaySuggestions(container, suggestions, input) {
    // Clear previous suggestions
    container.innerHTML = '';

    // Create a table element
    // Iterate over suggestions and create table rows
    suggestions.forEach(function (suggestion) {
        var address = suggestion.display_name;
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

    // Address autocomplete for start and end points
    var startAddressInput = document.getElementById('start-address');
    var endAddressInput = document.getElementById('end-address');
    var startAddressHints = document.getElementById('address-hints-start');
    var endAddressHints = document.getElementById('address-hints-end');

    startAddressInput.addEventListener('input', function () {
        fetchAddressHints(startAddressInput, startAddressHints);
    });

    endAddressInput.addEventListener('input', function () {
        fetchAddressHints(endAddressInput, endAddressHints);
    });


    // Form submission and route calculation
    var form = document.getElementById('coords_form');
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var start_point = startAddressInput.value;
        var end_point = endAddressInput.value;

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
                    var start_coords = data.start_coords;
                    var end_coords = data.end_coords;

                    // Clear previous layers
                    map.eachLayer(function (layer) {
                        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
                            map.removeLayer(layer);
                        }
                    });

                    L.marker([start_coords[0], start_coords[1]], { icon: L.icon({ iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png' }) }).addTo(map).bindPopup('Start').openPopup();
                    L.marker([end_coords[0], end_coords[1]], { icon: L.icon({ iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-red.png' }) }).addTo(map).bindPopup('End').openPopup();
                    L.polyline(route, { color: 'blue' }).addTo(map);
                    map.fitBounds(route);
                }
            });
    });
});