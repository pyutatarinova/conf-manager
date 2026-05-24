import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from api.conferences import router as conferences_router
from api.dev import router as dev_router
from api.files import router as files_router
from api.notifications import router as notifications_router
from api.submissions import router as submissions_router
from api.reviews import router as reviews_router
from auth.router import router as auth_router
from database import Base, SessionLocal, engine
from models.conference import Conference
from models.conference_role import ConferenceRole
from models.file import File
from models.invite import Invite
from models.section import Section
from models.submission import Submission
from models.submission_file import SubmissionFile
from models.user import User
from models.submission_author import SubmissionAuthor
from models.review_assignment import ReviewAssignment
from models.review import Review

app = FastAPI(
    title="Conference Platform API",
    version="1.0.0",
    root_path=os.getenv("ROOT_PATH", "")
)

frontend_base_url = os.getenv("FRONTEND_BASE_URL", "http://localhost").rstrip("/")
allowed_origins = [
    frontend_base_url,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

app.include_router(auth_router)
app.include_router(conferences_router, prefix="/conferences", tags=["conferences"])
app.include_router(dev_router, prefix="/dev", tags=["dev"])
app.include_router(files_router, prefix="/files", tags=["files"])
app.include_router(submissions_router, prefix="/submissions", tags=["submissions"])
app.include_router(notifications_router, prefix="/notifications", tags=["notifications"])
app.include_router(reviews_router, prefix="/reviews", tags=["reviews"])

@app.on_event("startup")
def _create_tables_on_startup():
    # Dev-friendly default: if DB is empty, create tables automatically.
    Base.metadata.create_all(bind=engine)
    # Backward-compatible schema fix for existing DBs without migrations.
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                ALTER TABLE submissions
                ADD COLUMN IF NOT EXISTS is_in_program BOOLEAN NOT NULL DEFAULT FALSE
                """
            )
        )


@app.get("/")
def root():
    return {"message": "Conference API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/test-db")
def test_db():
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"db": "connected"}
    finally:
        db.close()


@app.get("/init-db")
def init_db():
    Base.metadata.create_all(bind=engine)
    return {"status": "tables created"}


@app.get("/debug/tables")
def get_tables():
    with engine.connect() as conn:
        result = conn.execute(
            text(
                """
                SELECT tablename
                FROM pg_tables
                WHERE schemaname = 'public'
                """
            )
        )

        tables = [row[0] for row in result]

    return {
        "tables": tables,
        "count": len(tables)
    }
