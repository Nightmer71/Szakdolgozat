FROM python:3.13-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache postgresql-client gcc musl-dev libpq-dev

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy Django project
COPY . .

# Expose port
EXPOSE 8000

# Default command
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
