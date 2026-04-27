from fastapi import FastAPI
from database import engine, Base, SessionLocal
from sqlalchemy import text

# модели (важно чтобы импортировались для create_all)
from models.user import User
from models.conference import Conference
from models.conference_role import ConferenceRole
from models.invite import Invite
from models.file import File
from models.section import Section
from models.submission import Submission
from models.submission_file import SubmissionFile
from api.conferences import router as conferences_router
from api.files import router as files_router
from api.dev import router as dev_router
from auth.router import router as auth_router
from api.submissions import router as submissions_router



app = FastAPI(
    title="Conference Platform API",
    version="1.0.0"
)

app.include_router(auth_router)
app.include_router(conferences_router, prefix="/conferences", tags=["conferences"])
app.include_router(dev_router, prefix="/dev", tags=["dev"])
app.include_router(files_router, prefix="/files", tags=["files"])
app.include_router(submissions_router, prefix="/submissions", tags=["submissions"])

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