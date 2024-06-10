from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField, DecimalField
from wtforms.validators import DataRequired


class DirectionsForm(FlaskForm):
    start_point = StringField('Start Point', validators=[DataRequired()])
    end_point = StringField('End Point', validators=[DataRequired()])
    submit = SubmitField('Submit')


class CoordinatesForm(FlaskForm):
    start_lat = DecimalField('Start Latitude', validators=[DataRequired()])
    start_lon = DecimalField('Start Longitude', validators=[DataRequired()])
    end_lat = DecimalField('End Latitude', validators=[DataRequired()])
    end_lon = DecimalField('End Longitude', validators=[DataRequired()])
    submit = SubmitField('Generate Route')