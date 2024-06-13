from app import db


class Stations(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    station_name = db.Column(db.String(50), unique=True, nullable=False)
    station_lat = db.Column(db.Float, nullable=False)
    station_len = db.Column(db.Float, nullable=False)
    bikes_available = db.Column(db.Integer, nullable=False)
