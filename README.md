# Fantasy Basketball Web Application

A modern web application for managing fantasy basketball teams with match simulations.

## Project Overview

- **Frontend**: React 19 with Vite
- **Backend**: Django 6.0 with Django REST Framework
- **Database**: PostgreSQL 16
- **Infrastructure**: Docker & Docker Compose

## Quick Start (Development)

### Prerequisites

- Docker and Docker Compose installed
- OR: Python 3.13+, Node.js 20+, PostgreSQL 16 (for local development without Docker)

### Using Docker (Recommended)

1. Clone the repository:

      ```bash
      git clone <repo-url>
      cd Szakdoga
      ```

2. Copy environment file:

      ```bash
      cp .env.example .env
      ```

3. Start all services:

      ```bash
      docker-compose up
      ```

      Services will be available at:
      - **Frontend**: http://localhost:5173
      - **Backend API**: http://localhost:8000
      - **Django Admin**: http://localhost:8000/admin
      - **Database**: localhost:5432

### Without Docker (Local Development)

#### Backend Setup:

```bash
cd backend
python -m venv env
source env/bin/activate  # On Windows: env\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### Frontend Setup:

```bash
cd frontend
npm install
npm run dev
```

#### Database Setup:

Ensure PostgreSQL is running with:

- Database: `myprojectdb`
- User: `myuser`
- Password: `mypassword`

## External Data Source

Player data will be synced from the NBA public API:

- **API**: https://publicapi.dev/nba-data-api

## Troubleshooting

### Docker issues

- Check logs: `docker-compose logs <service-name>`
- Rebuild: `docker-compose up --build`
- Reset database: `docker-compose down -v` then `docker-compose up`

### Port conflicts

- Change ports in `docker-compose.yaml` if needed
- Restart containers: `docker-compose restart`

## Documentation

- See `docs/` folder for detailed design and planning documents
- Month 1: Requirements analysis and data model
- Month 2: Environment & architecture (this phase)
- Month 3+: Implementation phases

## Contributing

1. Create a feature branch
2. Make changes following the code structure
3. Test locally
4. Submit PR with description
