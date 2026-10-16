# SAT-AGRI backend

1. Open PowerShell in this `backend` folder.
2. Create a virtual environment (recommended): `python -m venv .venv`
3. Activate it: `.venv\Scripts\Activate.ps1`
4. Install: `pip install -r requirements.txt`
5. Run: `uvicorn main:app --reload`
6. Open http://127.0.0.1:8000/docs to test the API.

The CSV and model artifacts were copied from the uploaded Streamlit project. The API ports the existing prediction and recommendation flow. For deployment, restrict CORS to your actual frontend domain.
