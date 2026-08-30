#!/usr/bin/env python3
"""
wait_for_db.py — simple TCP poller to wait until host:port is accepting connections.
Usage:
    python wait_for_db.py --host db --port 5432 --retries 60 --interval 1
"""
import socket
import time
import argparse
import sys

def wait(host: str, port: int, retries: int = 60, interval: float = 1.0) -> int:
    attempt = 0
    while attempt < retries:
        attempt += 1
        try:
            with socket.create_connection((host, port), timeout=2):
                print(f"wait_for_db: success connecting to {host}:{port} (attempt {attempt})")
                return 0
        except Exception as e:
            print(f"wait_for_db: attempt {attempt}/{retries} - cannot connect to {host}:{port}: {e}")
            time.sleep(interval)
    print(f"wait_for_db: timed out after {retries} attempts trying to reach {host}:{port}")
    return 2

def main():
    parser = argparse.ArgumentParser(description="Wait for TCP host:port to become available")
    parser.add_argument("--host", default="db", help="Database host (default: db)")
    parser.add_argument("--port", type=int, default=5432, help="Database port (default: 5432)")
    parser.add_argument("--retries", type=int, default=60, help="Number of retries (default: 60)")
    parser.add_argument("--interval", type=float, default=1.0, help="Seconds between retries (default: 1)")
    args = parser.parse_args()

    rc = wait(args.host, args.port, args.retries, args.interval)
    sys.exit(rc)

if __name__ == "__main__":
    main()
