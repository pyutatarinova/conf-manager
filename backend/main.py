from fastapi import FastAPI
from database import engine, Base, SessionLocal
from sqlalchemy import text

# модели (важно чтобы импортировались для create_all)
from models.user import User
from models.role import Role
from models.user_role import UserRole

app = FastAPI(
    title="Conference Platform API",
    version="1.0.0"
)

# -------------------------
# BASIC ROUTES
# -------------------------

@app.get("/")
def root():
    return {"message": "Conference API is running"}

@app.get("/health")
def health():
    return {"status": "ok"}

# -------------------------
# DB TEST (SQLAlchemy)
# -------------------------

@app.get("/test-db")
def test_db():
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"db": "connected"}
    finally:
        db.close()

# -------------------------
# INIT DB (CREATE TABLES)
# -------------------------

@app.get("/init-db")
def init_db():
    Base.metadata.create_all(bind=engine)
    return {"status": "tables created"}

# -------------------------
# check DB
# -------------------------

@app.get("/debug/tables")
def get_tables():
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT tablename
                FROM pg_tables
                WHERE schemaname = 'public'
            """)
        )

        tables = [row[0] for row in result]

    return {
        "tables": tables,
        "count": len(tables)
    }