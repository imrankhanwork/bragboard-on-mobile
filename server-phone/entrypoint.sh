#!/bin/sh
# simple entrypoint that waits for the DB to accept TCP connections
# then execs the passed-in CMD (uvicorn)

# Defaults (can be overridden via environment variables)
: "${DB_HOST:=db}"
: "${DB_PORT:=5432}"
: "${WAIT_RETRIES:=60}"
: "${WAIT_INTERVAL:=1}"

echo "entrypoint: waiting for database ${DB_HOST}:${DB_PORT} (max ${WAIT_RETRIES} retries)..."

python /app/wait_for_db.py --host "${DB_HOST}" --port "${DB_PORT}" --retries "${WAIT_RETRIES}" --interval "${WAIT_INTERVAL}"
RC=$?
if [ "$RC" -ne 0 ]; then
  echo "entrypoint: database did not become available, exiting with code $RC"
  exit $RC
fi

echo "entrypoint: database is reachable — starting app"
# exec the CMD from Dockerfile/CMD or docker-compose
exec "$@"
