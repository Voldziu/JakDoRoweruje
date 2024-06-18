from app import app
from scheduler import start_scheduler

if __name__ == "__main__":
    start_scheduler()
    app.run(debug=True,host="0.0.0.0",port=5001)



