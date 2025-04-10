from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse

from app.config import settings
from app.api import auth, companies, emails, users
from app.models.user import User
from app.db.base import Base, engine
from app.db.session import get_db, SessionLocal
from app.utils.security import get_password_hash

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
            print("Created admin user: admin@example.com / admin123")
    finally:
        db.close()

@app.on_event("startup")
async def startup_event():
    create_admin_user()

@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url=f"{settings.API_PREFIX}/docs")


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)