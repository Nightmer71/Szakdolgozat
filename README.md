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

## Project Structure

```
/
├── docs/                      # Documentation
│   ├── month1.md
│   ├── month1_user_stories.md
│   ├── month1_data_model.md
│   └── month2.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   ├── backend/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── game/                  # Main application
│       ├── models.py          # Player, Team, RosterEntry, Match
│       ├── admin.py
│       └── management/        # sync_players command
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── api.js            # API client
│       ├── App.jsx
│       └── main.jsx
└── docker-compose.yaml
```

## Available Endpoints (Month 2+)

### Authentication (To be implemented in Month 3)

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Players

- `GET /api/players/` - List all players (paginated)
- `GET /api/players/{id}` - Get player details

### Teams

- `GET /api/teams/` - List current user's teams
- `POST /api/teams/` - Create a new team
- `POST /api/teams/{id}/players/` - Add player to team

### Matches

- `POST /api/matches/simulate/` - Simulate a match

## Environment Variables

Key variables (see `.env.example`):

- `DEBUG` - Django debug mode (True for development)
- `DATABASE_URL` - PostgreSQL connection string
- `VITE_API_URL` - React API base URL
- `CORS_ALLOWED_ORIGINS` - CORS whitelist

## Development Workflow

1. **Make changes** in `frontend/src` or `backend/` folders
2. **Hot reload** happens automatically (Vite for frontend, Django runserver for backend)
3. **Run migrations** when changing models:
      ```bash
      docker-compose exec backend python manage.py migrate
      ```
4. **Check admin panel** at http://localhost:8000/admin

## Database Admin

Access Django admin at `http://localhost:8000/admin` with:

- Username: Create via `python manage.py createsuperuser`
- Password: Set during creation

## Testing (To be implemented in Month 7)

Backend tests:

```bash
docker-compose exec backend pytest
```

Frontend tests:

```bash
docker-compose exec frontend npm test
```

## External Data Source

Player data will be synced from the NBA public API:

- **API**: https://publicapi.dev/nba-data-api
- **Sync Command**: `python manage.py sync_players --source=nba` (Month 3)

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

## Future Phases

- Month 3: API implementation & JWT auth
- Month 4: Frontend UI components
- Month 5: Team builder & match simulation
- Month 6: Leaderboard system
- Month 7: Testing & optimization
- Month 8: Documentation

## License

Academic project - Szakdolgozat
