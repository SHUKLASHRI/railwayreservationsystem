"""
Load Indian Railways-style train detail CSV into PostgreSQL (Supabase).

Environment:
  TRAIN_DETAILS_CSV — path to CSV (default: database/data/train_details.csv)
  DATABASE_URL or DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT

CSV columns (flexible names, case-insensitive):
  Train No, Train Name, SEQ, Station Code, Station Name,
  Arrival time, Departure Time, Distance,
  Source Station, Destination Station (and optional *Name columns)

After loading schedules, ensures train_classes, train_seat_configurations, and
train_instances exist (90 days from today).
"""
from __future__ import annotations

import csv
import datetime
import os
import re
import sys
import traceback
from pathlib import Path

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CSV = ROOT / "database" / "data" / "train_details.csv"

DATABASE_URL = os.getenv("DATABASE_URL")
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT", "5432")

TRAIN_CLASSES = [
    ("1A", "First Class AC"),
    ("2A", "AC 2-Tier"),
    ("3A", "AC 3-Tier"),
    ("SL", "Sleeper"),
    ("CC", "AC Chair Car"),
    ("EC", "Executive Chair Car"),
    ("2S", "Second Sitting"),
    ("GEN", "General/Unreserved"),
]

CLASS_CONFIGS = {
    "Rajdhani": [("1A", 4500), ("2A", 3200), ("3A", 2200)],
    "Shatabdi": [("EC", 2500), ("CC", 1200)],
    "Vande Bharat": [("EC", 2000), ("CC", 950)],
    "Superfast": [("2A", 2800), ("3A", 1800), ("SL", 750), ("2S", 250)],
    "Express": [("2A", 2500), ("3A", 1600), ("SL", 600), ("GEN", 150)],
    "Mail": [("2A", 2500), ("3A", 1600), ("SL", 600), ("GEN", 150)],
    "Duronto": [("2A", 2800), ("3A", 1800), ("SL", 750)],
    "Garib Rath": [("3A", 1200), ("SL", 400)],
    "Passenger": [("SL", 200), ("GEN", 50)],
}


def get_pg_connection():
    if DB_HOST and DB_USER and DB_PASS:
        return psycopg2.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASS,
            dbname=DB_NAME or "postgres",
            port=DB_PORT,
            sslmode="require",
            connect_timeout=15,
        )
    if DATABASE_URL:
        url = DATABASE_URL.strip().strip('"').strip("'")
        if "sslmode=" not in url:
            sep = "&" if "?" in url else "?"
            url += f"{sep}sslmode=require"
        return psycopg2.connect(url, connect_timeout=15)
    raise RuntimeError("Set DATABASE_URL or DB_HOST, DB_USER, DB_PASS (and DB_NAME) for PostgreSQL.")


def _row_get(row: dict, *candidates: str) -> str:
    """Match CSV header flexibly."""
    keys = {k.strip().lower(): k for k in row.keys()}
    for c in candidates:
        lk = c.lower()
        if lk in keys:
            v = row.get(keys[lk], "")
            return v.strip() if v is not None else ""
    return ""


_TIME_CLEAN = re.compile(r"[^\d:]")


def normalize_time(raw: str) -> str:
    s = (raw or "").strip()
    if not s or s in ("-", "**", "NA", "Source", "Dest", "NM"):
        return "00:00:00"
    s = _TIME_CLEAN.sub("", s)
    parts = [p for p in s.split(":") if p != ""]
    if not parts:
        return "00:00:00"
    while len(parts) < 3:
        parts.append("00")
    h, m, sec = int(parts[0]) % 24, min(int(parts[1]) if len(parts) > 1 else 0, 59), min(int(parts[2]) if len(parts) > 2 else 0, 59)
    return f"{h:02d}:{m:02d}:{sec:02d}"


def infer_train_type(name: str) -> str:
    u = (name or "").upper()
    if "RAJDHANI" in u:
        return "Rajdhani"
    if "SHATABDI" in u:
        return "Shatabdi"
    if "VANDE BHARAT" in u:
        return "Vande Bharat"
    if "GARIB" in u:
        return "Garib Rath"
    if "DURONTO" in u:
        return "Duronto"
    if "PASSENGER" in u:
        return "Passenger"
    if "MAIL" in u and "RAJDHANI" not in u:
        return "Mail"
    if "SUPERFAST" in u or " SF" in u or u.endswith(" SF"):
        return "Superfast"
    return "Express"


def ensure_classes_and_inventory(cur, days_instances: int = 90) -> None:
    for tc in TRAIN_CLASSES:
        cur.execute(
            "INSERT INTO train_classes (class_code, class_name) VALUES (%s, %s) ON CONFLICT (class_code) DO NOTHING",
            tc,
        )
    cur.execute("SELECT class_id, class_code FROM train_classes")
    c_map = {code: cid for cid, code in cur.fetchall()}

    cur.execute("SELECT train_id, train_type, train_number FROM trains")
    trains = cur.fetchall()
    for tid, ttype, tnum in trains:
        cfg = CLASS_CONFIGS.get(ttype, CLASS_CONFIGS["Express"])
        for cls_code, fare in cfg:
            if cls_code not in c_map:
                continue
            seats = (
                20
                if cls_code == "1A"
                else (60 if cls_code in ("2A", "EC") else (400 if cls_code in ("SL", "GEN") else 180))
            )
            cur.execute(
                """
                INSERT INTO train_seat_configurations (train_id, class_id, total_seats, base_fare)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (train_id, class_id) DO UPDATE SET
                    total_seats = EXCLUDED.total_seats,
                    base_fare = EXCLUDED.base_fare
                """,
                (tid, c_map[cls_code], seats, fare),
            )

    today = datetime.date.today()
    for i in range(days_instances):
        d = today + datetime.timedelta(days=i)
        for tid, _, _ in trains:
            cur.execute(
                """
                INSERT INTO train_instances (train_id, journey_date, status)
                VALUES (%s, %s, %s)
                ON CONFLICT (train_id, journey_date) DO NOTHING
                """,
                (tid, d, "ON_TIME"),
            )


def ingest(csv_path: Path) -> None:
    if not csv_path.is_file():
        raise FileNotFoundError(f"CSV not found: {csv_path}")

    print(f"Using CSV: {csv_path}", flush=True)
    conn = get_pg_connection()
    conn.autocommit = True
    cur = conn.cursor()

    try:
        print("Truncating train_schedules...", flush=True)
        cur.execute("TRUNCATE train_schedules RESTART IDENTITY CASCADE")

        stations: dict[str, str] = {}
        trains_meta: dict[str, tuple[str, str, str]] = {}

        with open(csv_path, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        for row in rows:
            s_code = _row_get(row, "Station Code").upper()
            s_name = _row_get(row, "Station Name")
            if s_code:
                stations.setdefault(s_code, s_name or s_code)

            src_code = _row_get(row, "Source Station").upper()
            src_name = _row_get(row, "Source Station Name", "source station name")
            dst_code = _row_get(row, "Destination Station").upper()
            dst_name = _row_get(row, "Destination Station Name", "destination station name")
            if src_code:
                stations.setdefault(src_code, src_name or src_code)
            if dst_code:
                stations.setdefault(dst_code, dst_name or dst_code)

            t_num = _row_get(row, "Train No", "train no")
            t_name = _row_get(row, "Train Name", "train name")
            if t_num and t_name:
                trains_meta[t_num] = (t_name, src_code, dst_code)

        print(f"Upserting {len(stations)} stations...", flush=True)
        station_rows = [(c, n, n, "") for c, n in stations.items()]
        psycopg2.extras.execute_values(
            cur,
            "INSERT INTO stations (station_code, station_name, city, state) VALUES %s ON CONFLICT (station_code) DO NOTHING",
            station_rows,
        )

        cur.execute("SELECT station_id, station_code FROM stations")
        s_map = {code: sid for sid, code in cur.fetchall()}

        print(f"Upserting {len(trains_meta)} trains...", flush=True)
        train_rows = []
        for num, (name, src_c, dst_c) in trains_meta.items():
            sid = s_map.get(src_c)
            did = s_map.get(dst_c)
            if not sid or not did:
                print(f"  Skip train {num}: missing station mapping for {src_c}->{dst_c}", flush=True)
                continue
            ttype = infer_train_type(name)
            train_rows.append((num, name, ttype, sid, did))

        psycopg2.extras.execute_values(
            cur,
            """
            INSERT INTO trains (train_number, train_name, train_type, source_station_id, destination_station_id)
            VALUES %s
            ON CONFLICT (train_number) DO UPDATE SET
                train_name = EXCLUDED.train_name,
                train_type = EXCLUDED.train_type,
                source_station_id = EXCLUDED.source_station_id,
                destination_station_id = EXCLUDED.destination_station_id
            """,
            train_rows,
        )

        cur.execute("SELECT train_id, train_number FROM trains")
        t_map = {num: tid for tid, num in cur.fetchall()}

        batch: list[tuple] = []
        count = 0
        for row in rows:
            t_num = _row_get(row, "Train No", "train no")
            s_code = _row_get(row, "Station Code").upper()
            t_id = t_map.get(t_num)
            s_id = s_map.get(s_code)
            if not t_id or not s_id:
                continue
            try:
                seq = int(_row_get(row, "SEQ", "seq", "Seq"))
            except ValueError:
                continue
            arr = normalize_time(_row_get(row, "Arrival time", "Arrival Time"))
            dep = normalize_time(_row_get(row, "Departure Time", "Departure time", "Departure"))
            dist_s = _row_get(row, "Distance", "distance")
            try:
                dist = float(dist_s) if dist_s else 0.0
            except ValueError:
                dist = 0.0
            day_c = 1
            try:
                dc = _row_get(row, "Day", "day_count")
                if dc:
                    day_c = int(dc)
            except ValueError:
                pass
            batch.append((t_id, s_id, seq, arr, dep, day_c, dist))

            if len(batch) >= 1000:
                psycopg2.extras.execute_values(
                    cur,
                    """
                    INSERT INTO train_schedules
                    (train_id, station_id, stop_sequence, arrival_time, departure_time, day_count, distance_from_source)
                    VALUES %s
                    ON CONFLICT (train_id, stop_sequence) DO UPDATE SET
                        station_id = EXCLUDED.station_id,
                        arrival_time = EXCLUDED.arrival_time,
                        departure_time = EXCLUDED.departure_time,
                        day_count = EXCLUDED.day_count,
                        distance_from_source = EXCLUDED.distance_from_source
                    """,
                    batch,
                )
                count += len(batch)
                batch = []

        if batch:
            psycopg2.extras.execute_values(
                cur,
                """
                INSERT INTO train_schedules
                (train_id, station_id, stop_sequence, arrival_time, departure_time, day_count, distance_from_source)
                VALUES %s
                ON CONFLICT (train_id, stop_sequence) DO UPDATE SET
                    station_id = EXCLUDED.station_id,
                    arrival_time = EXCLUDED.arrival_time,
                    departure_time = EXCLUDED.departure_time,
                    day_count = EXCLUDED.day_count,
                    distance_from_source = EXCLUDED.distance_from_source
                """,
                batch,
            )
            count += len(batch)

        print(f"Ingested {count} schedule rows.", flush=True)

        print("Ensuring classes, seat configs, train instances...", flush=True)
        ensure_classes_and_inventory(cur, days_instances=90)
        print("Done.", flush=True)

    except Exception:
        print("!!! FATAL !!!", flush=True)
        traceback.print_exc()
        raise
    finally:
        cur.close()
        conn.close()


def main():
    csv_arg = os.getenv("TRAIN_DETAILS_CSV") or (sys.argv[1] if len(sys.argv) > 1 else None)
    if csv_arg:
        path = Path(csv_arg)
        if not path.is_file():
            alt = ROOT / csv_arg
            path = alt if alt.is_file() else path
    else:
        path = DEFAULT_CSV
    ingest(path.resolve())


if __name__ == "__main__":
    main()
