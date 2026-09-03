"""
One-shot script to run the 0004_student_profiles migration directly via psycopg.
Run from: d:/SIH 2026/SIH-2026/api/
Usage: python run_migration_0004.py
"""
import os
import sys

# Try to load dotenv for .env file
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))
except ImportError:
    pass

import sqlalchemy as sa

# Build DB URL — swap Docker hostname for localhost when running locally
raw_url = os.environ.get(
    "DATABASE_URL",
    "postgresql+psycopg://complaints:complaints@localhost:5432/complaints"
)
db_url = raw_url.replace("@postgres:", "@localhost:")

engine = sa.create_engine(db_url, echo=True)

DDL = """
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'student_profiles'
    ) THEN
        CREATE TABLE student_profiles (
            id            SERIAL PRIMARY KEY,
            user_id       INTEGER NOT NULL UNIQUE REFERENCES users(id),
            full_name     VARCHAR(255) NOT NULL,
            department    VARCHAR(120) NOT NULL,
            prn_number    VARCHAR(50)  NOT NULL UNIQUE,
            division      VARCHAR(10)  NOT NULL,
            roll_no       VARCHAR(30)  NOT NULL,
            year_semester VARCHAR(30),
            contact_number VARCHAR(20),
            updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
        );
        RAISE NOTICE 'student_profiles table created.';
    ELSE
        RAISE NOTICE 'student_profiles table already exists — skipping.';
    END IF;
END
$$;
"""

with engine.connect() as conn:
    conn.execute(sa.text(DDL))
    conn.commit()

print("\n✅ Migration 0004_student_profiles complete.")
