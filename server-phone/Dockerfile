FROM python:3.11-slim

# set working dir
WORKDIR /app

# copy requirements and install
COPY ./requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# copy application code
COPY ./app /app/app

# copy helper scripts
COPY ./entrypoint.sh /app/entrypoint.sh
COPY ./wait_for_db.py /app/wait_for_db.py

# make entrypoint executable
RUN chmod +x /app/entrypoint.sh

# ensure logs are not buffered (helpful for docker logs)
ENV PYTHONUNBUFFERED=1

# entrypoint will wait for DB then exec the CMD
ENTRYPOINT ["/app/entrypoint.sh"]

# default command to start uvicorn (keeps --reload for dev)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
