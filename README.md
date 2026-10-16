<<<<<<< HEAD
# SAT-AGRI FPO Website Starter

This package converts the uploaded Streamlit project into a React frontend + FastAPI backend while reusing the supplied CSV, trained model, and model column list.

## Requirements
- Windows with Python 3.10–3.12 recommended
- Node.js LTS (Node 20 or 22)

## 1. Start the backend
Open PowerShell in `backend`:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```
Test `http://127.0.0.1:8000/docs`.

## 2. Start the frontend
Open a SECOND PowerShell window in `frontend`:
```powershell
npm install
npm run dev
```
Open the local URL printed by Vite, normally `http://localhost:5173`.

Keep both terminals running while you use the website.

## 3. Deployment overview
- Deploy `backend` as a Python web service on Render. Build/install command: `pip install -r requirements.txt`; start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- Deploy `frontend` on Vercel with Root Directory `frontend`, framework Vite, build command `npm run build`, output directory `dist`.
- In Vercel environment variables, set `VITE_API_URL` to the deployed backend URL (no trailing slash), then redeploy.
- Before public launch, change the backend CORS `allow_origins` from `["*"]` to your Vercel domain.

## Notes
- The API keeps the existing prediction model and dataset files, and ports the prediction/recommendation flow from `app.py`.
- The original model artifact was created with scikit-learn 1.7.2, so the backend pins that version for compatibility.
- Treat model outputs as estimates, not guaranteed farmer outcomes. Review data and causal assumptions before making research claims.
=======
# SAT-AGRI backend

1. Open PowerShell in this `backend` folder.
2. Create a virtual environment (recommended): `python -m venv .venv`
3. Activate it: `.venv\Scripts\Activate.ps1`
4. Install: `pip install -r requirements.txt`
5. Run: `uvicorn main:app --reload`
6. Open http://127.0.0.1:8000/docs to test the API.

The CSV and model artifacts were copied from the uploaded Streamlit project. The API ports the existing prediction and recommendation flow. For deployment, restrict CORS to your actual frontend domain.
>>>>>>> 981d7655acd071c0d5a6b195076373b9d3559308
