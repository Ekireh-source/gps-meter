# Setup Instructions

## Backend Setup

### 1. Install Dependencies

```bash
cd backend-api
pip install -r requirements.txt
```

Or if using virtual environment:

```bash
cd backend-api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

### 4. Run Development Server

```bash
python manage.py runserver
```

The backend API will be available at `http://localhost:8000`

API endpoints will be at `http://localhost:8000/api/`

## Frontend Setup

### 1. Install Dependencies

```bash
cd client
npm install
```

Or if using pnpm (as configured):

```bash
cd client
pnpm install
```

### 2. Create Environment File

Create `.env.local` in the `client` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 3. Run Development Server

```bash
npm run dev
```

Or with pnpm:

```bash
pnpm dev
```

The frontend will be available at `http://localhost:3000`

## Testing the Setup

### Backend

1. Visit `http://localhost:8000/admin/` to access Django admin
2. Visit `http://localhost:8000/api/meters/` to see the API (should return empty list)

### Frontend

1. Visit `http://localhost:3000` to see the dashboard
2. Navigate to `/meters` to see meters list
3. Navigate to `/map` to see the map view

## Creating Test Data

### Via Django Admin

1. Go to `http://localhost:8000/admin/`
2. Login with superuser credentials
3. Create an Electricity Meter with:
   - meter_id: "MTR-001"
   - name: "Test Meter"
   - default_latitude: 40.7128
   - default_longitude: -74.0060
   - threshold_distance: 50

### Via API

```bash
curl -X POST http://localhost:8000/api/meters/ \
  -H "Content-Type: application/json" \
  -d '{
    "meter_id": "MTR-001",
    "name": "Test Meter",
    "default_latitude": 40.7128,
    "default_longitude": -74.0060,
    "threshold_distance": 50,
    "status": "ON"
  }'
```

## Troubleshooting

### Backend Issues

- **Import errors**: Make sure you're in the virtual environment
- **Database errors**: Run migrations: `python manage.py migrate`
- **CORS errors**: Check `CORS_ALLOWED_ORIGINS` in settings.py

### Frontend Issues

- **Module not found**: Run `npm install` or `pnpm install`
- **API connection errors**: Check `NEXT_PUBLIC_API_URL` in `.env.local`
- **Map not loading**: Ensure Leaflet CSS is imported (already in globals.css)
- **TypeScript errors**: The packages need to be installed first

## Next Steps

1. Create meters via admin or API
2. Test location updates by sending POST requests to `/api/meters/{id}/location/`
3. View meters on the frontend dashboard and map
4. Test automatic shutdown when meter moves beyond threshold

