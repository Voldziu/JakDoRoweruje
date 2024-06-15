from flask import Flask
from config import Config
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os

app = Flask(__name__)
app.config.from_object(Config)



db = SQLAlchemy(app)

migrate = Migrate(app, db)
migration_dir = os.path.join(app.root_path,migrate.directory) # can be deprecated
should_schedule = os.path.exists(migration_dir)

from app import models, routes

from scheduler import start_scheduler

# if should_schedule:
#     print("dzialam")
#     start_scheduler()

