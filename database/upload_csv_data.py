"""
Backward-compatible entry point: loads train CSV into PostgreSQL (Supabase).

Prefer: python database/ingest_train_csv.py [path/to.csv]
Env: TRAIN_DETAILS_CSV, DATABASE_URL or DB_* vars.

See database/ingest_train_csv.py for details.
"""
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from database.ingest_train_csv import main

if __name__ == "__main__":
    main()
