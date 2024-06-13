from app import app,start_scheduler

if __name__ == "__main__":
    start_scheduler()
    app.run(debug=True,host="0.0.0.0")



