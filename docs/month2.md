# Month 2: Environment & Base Architecture Setup

This document describes the Month 2 deliverables extracted from the project plan.

## Overview

Month 2 focuses on setting up the development environment and establishing the foundational architecture that connects Django backend, React frontend, and PostgreSQL database. The goal is to have a working Docker-based local development setup with basic project scaffolding in place.

## Deliverables Checklist

### ✅ Infrastructure & Docker Setup

- [x] Docker Compose configuration (`docker-compose.yaml`)
     - PostgreSQL service with health checks
     - Django backend service with auto-migration
     - React frontend service with Vite dev server
     - Shared network bridge (`basketball_network`)
     - Volume persistence for database
- [x] Backend Dockerfile (Python 3.13-alpine)
     - PostgreSQL client dependencies (psycopg2)
     - Python requirements installation
- [x] Frontend Dockerfile (Node 20-alpine)
     - npm dependency installation
     - Vite dev server exposure on port 5173
- [x] .dockerignore files for both services

### ✅ Django Backend - Base Setup

- [x] Django project structure (already initialized)
- [x] PostgreSQL database configuration in `settings.py`
- [x] Django app `game` with core models (Player, Team, RosterEntry, Match)
- [ ] Django REST Framework integration (install & configure)
- [ ] CORS headers middleware configuration
- [ ] API router setup (to be added in Month 3)

### ✅ React Frontend - Base Setup

- [x] React project structure (already initialized with Vite)
- [x] package.json with React 19 dependencies
- [ ] Environment variable configuration for API base URL
- [ ] Axios or Fetch wrapper for API communication
- [ ] Basic component structure (App.jsx, main entry point)

### ⏳ Development Environment Integration

- [x] Docker Compose for local development
- [ ] Environment variables documentation (.env.example)
- [ ] Local development startup guide (README)

### ⏳ Initial CI/CD Configuration

- [ ] GitHub Actions workflow skeleton (optional for Month 2, can defer to Month 3)

## File Structure After Month 2

```
/
├── docker-compose.yaml        ✅
├── docs/
│   ├── month1.md
│   ├── month1_user_stories.md
│   ├── month1_data_model.md
│   └── month2.md             (this file)
├── backend/
│   ├── Dockerfile             ✅
│   ├── requirements.txt        (needs DRF, cors, psycopg2)
│   ├── manage.py
│   ├── .dockerignore          ✅
│   ├── backend/
│   │   ├── settings.py        (needs DRF & CORS config)
│   │   ├── urls.py
│   │   └── asgi.py
│   ├── game/
│   │   ├── models.py          ✅
│   │   ├── admin.py           ✅
│   │   └── management/        ✅
│   └── venv/ (or env/)
├── frontend/
│   ├── Dockerfile             ✅
│   ├── .dockerignore          ✅
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       └── index.css
└── env.example (to be created)
```

## Next Steps (Month 3)

- Implement DRF Serializers for Player, Team, RosterEntry, Match
- Implement ViewSets and API endpoints
- Implement JWT authentication (djangorestframework-simplejwt)
- Create React API client and basic UI components
- Integrate player sync with external NBA API

## Running the Project (After Month 2 completion)

```bash
# Start all services
docker-compose up

# Or specific services
docker-compose up db backend frontend

# Access points:
# - Frontend: http://localhost:5173
# - Backend API: http://localhost:8000
# - Django Admin: http://localhost:8000/admin
# - Database: localhost:5432
```

## Notes

- Docker database credentials are hardcoded in docker-compose.yaml for development only. Use .env variables in production.
- React frontend uses `VITE_API_URL` environment variable for API base URL (defaults to `http://backend:8000/api` in Docker).
- Migrations will auto-run on backend startup via the docker-compose command.
