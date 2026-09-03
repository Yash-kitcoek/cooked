import os
from sqlalchemy import create_engine, text
from app.config import settings

db_url = settings.database_url
if "@postgres:" in db_url:
    db_url = db_url.replace("@postgres:", "@localhost:")

engine = create_engine(db_url)

with engine.connect() as conn:
    print("Adding username column to users table if not exists...")
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(120);"))
    conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_username ON users (username);"))
    conn.commit()
    print("Successfully added username column and index to PostgreSQL database!")
