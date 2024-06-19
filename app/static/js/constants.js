const wroclawCoordinates = [51.1097, 17.0316];
const southWestCoords = [51.05-0.18,16.85-0.28];
const northEastCoords = [51.17+0.18,17.20+0.28];
const wroclawCityBounds= [51.03,51.17,16.85,17.20];
const CityName = "Wrocław";

const defaultStartStationIconUrl='https://img.icons8.com/ios/50/65A135/bicycle.png';
const chosenStartStationIconUrl ="https://img.icons8.com/ios/50/335E11/bicycle.png";
const defaultEndStationIconUrl = "https://img.icons8.com/ios/50/F23513/bicycle.png";
const chosenEndStationIconUrl= "https://img.icons8.com/ios/50/AB2912/bicycle.png";
const defaultStartLocationIconUrl='http://maps.google.com/mapfiles/ms/icons/green-dot.png';
const defaultEndLocationIconUrl='http://maps.google.com/mapfiles/ms/icons/red-dot.png';


const defaultStartStationIcon = L.icon({
    iconUrl: 'https://img.icons8.com/ios/50/65A135/bicycle.png',
    iconSize: [40, 40],
    iconAnchor: [25, 50],
    popupAnchor: [0, -50]
});

const chosenStartStationIcon = L.icon({
    iconUrl: "https://img.icons8.com/ios/50/335E11/bicycle.png",
    iconSize: [40, 40],
    iconAnchor: [25, 50],
    popupAnchor: [0, -50]
});

const defaultEndStationIcon = L.icon({
    iconUrl: "https://img.icons8.com/ios/50/F23513/bicycle.png",
    iconSize: [40, 40],
    iconAnchor: [25, 50],
    popupAnchor: [0, -50]
});

const chosenEndStationIcon = L.icon({
    iconUrl: "https://img.icons8.com/ios/50/AB2912/bicycle.png",
    iconSize: [40, 40],
    iconAnchor: [25, 50],
    popupAnchor: [0, -50]
});

const defaultStartLocationIcon = L.icon({
    iconUrl: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
    iconSize: [30, 30],
    iconAnchor: [25, 50],
    popupAnchor: [0, -50]
});

const defaultEndLocationIcon = L.icon({
    iconUrl: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
    iconSize: [30, 30],
    iconAnchor: [25, 50],
    popupAnchor: [0, -50]
});