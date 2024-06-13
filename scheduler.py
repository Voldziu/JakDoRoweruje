from apscheduler.schedulers.background import BackgroundScheduler
from functionalities import update_database


def start_scheduler():
    update_database()
    scheduler = BackgroundScheduler()
    scheduler.add_job(func=update_database, trigger="interval", minutes=2)
    scheduler.start()