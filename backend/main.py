import os
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from the parent directory .env if available
load_dotenv(dotenv_path="../.env")

from schemas import AnalyzeRequest, ClinicalSummaryResponse
from services.ai_service import analyze_clinical_encounter
from services.abdm_worker import process_fhir_bundle_async

app = FastAPI(
    title="SwasthyaLipi Clinical AI Engine",
    description="Deterministic NLP and FHIR orchestration engine",
    version="1.0.0"
)

# Enable CORS for the React frontend (running on Vite's default port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173", "*"], # * for prototype, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "clinical_engine"}

@app.post("/api/analyze-encounter", response_model=ClinicalSummaryResponse)
def analyze_encounter(request: AnalyzeRequest):
    """
    Takes the raw patient interview answers and returns a strict, Pydantic-validated
    structured JSON object containing the SOAP note, differentials, and AYUSH Prakriti.
    """
    try:
        response = analyze_clinical_encounter(request)
        return response
    except Exception as e:
        # In a production app, we would log this to Sentry/DataDog
        print(f"Error during AI analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/fhir/publish")
def publish_fhir_bundle(payload: dict, background_tasks: BackgroundTasks):
    """
    Simulates placing a FHIR bundle into an Apache Kafka topic.
    Returns 202 Accepted immediately so the frontend UI doesn't freeze,
    while the BackgroundTask simulates the consumer worker pushing to ABDM.
    """
    # Extract patient_id from FHIR payload if it exists, else use placeholder
    patient_id = "Unknown"
    try:
        # Basic FHIR traversal to find patient name or ID
        for entry in payload.get("entry", []):
            if entry.get("resource", {}).get("resourceType") == "Patient":
                patient_id = entry["resource"].get("id", "Unknown")
                break
    except Exception:
        pass
        
    # Send the job to the background worker
    background_tasks.add_task(process_fhir_bundle_async, payload, patient_id)
    
    # Return immediately to unblock the Doctor's browser
    return {"status": "accepted", "message": "FHIR bundle placed in transmission queue."}

if __name__ == "__main__":
    import uvicorn
    # Run the server on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
