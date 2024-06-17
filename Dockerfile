FROM python:3.11.4-alpine3.18

WORKDIR /app

COPY ./requirements.txt /app/

RUN pip install -r requirements.txt

COPY . .
CMD ["flask","db","init"]
CMD ["flask", "db", "migrate", "-m", "Stations table"]
CMD ["flask","db","upgrade"]

CMD ["python","run.py"]