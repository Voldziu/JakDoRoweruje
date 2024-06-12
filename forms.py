from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField, DecimalField
from wtforms.validators import DataRequired
class DirectionsForm(FlaskForm):
    start_point = StringField('Start Point', validators=[DataRequired()], render_kw={"autocomplete": "off"})
    end_point = StringField('End Point', validators=[DataRequired()], render_kw={"autocomplete": "off"})
    submit = SubmitField('Submit')

