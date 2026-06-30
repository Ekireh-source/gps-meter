cd backend_api
source venv/bin/activate
pip install -r requirements.txt
python manage.py runserver


cd client
pnpm install
pnpm run dev
