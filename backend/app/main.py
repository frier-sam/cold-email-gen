# app/main.py
import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse

from app.config import settings
from app.api import auth, companies, emails, users, tasks
from app.models.user import User
from app.db.base import Base, engine
from app.db.session import get_db, SessionLocal
from app.utils.security import get_password_hash

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import and initialize the task queue
from app.utils import task_queue
logger.info("Task queue imported and worker should be running")

# Create tables in the database
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    docs_url=f"{settings.API_PREFIX}/docs",
    redoc_url=f"{settings.API_PREFIX}/redoc",
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this in production with specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router, prefix=f"{settings.API_PREFIX}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{settings.API_PREFIX}/users", tags=["users"])
app.include_router(companies.router, prefix=f"{settings.API_PREFIX}/companies", tags=["companies"])
app.include_router(emails.router, prefix=f"{settings.API_PREFIX}/emails", tags=["emails"])
app.include_router(tasks.router, prefix=f"{settings.API_PREFIX}/tasks", tags=["tasks"])

# Create admin user if no users exist
def create_admin_user():
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            admin_user = User(
                email="admin@example.com",
                username="admin",
                hashed_password=get_password_hash("admin123"),
                is_active=True,
                is_admin=True,
                max_companies=10,
                max_websites_per_email=5,
                max_emails_per_day=20,
            )
            db.add(admin_user)
            db.commit()
            logger.info("Created admin user: admin@example.com / admin123")
    finally:
        db.close()

@app.on_event("startup")
async def startup_event():
    logger.info("Application starting up")
    create_admin_user()
    # Ensure task queue worker is running
    if not task_queue.worker_thread.is_alive():
        logger.warning("Worker thread not alive, starting a new one")
        task_queue.worker_thread = task_queue.start_background_worker()
    else:
        logger.info("Worker thread is alive")

@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url=f"{settings.API_PREFIX}/docs")


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)