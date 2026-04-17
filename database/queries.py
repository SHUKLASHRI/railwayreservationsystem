"""Database query helpers."""

from .db_connection import get_connection


def initialize_schema():
    conn = get_connection()
    with conn:
        with open("database/schema.sql") as f:
            conn.executescript(f.read())
