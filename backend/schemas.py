from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal

class DifferentialDiagnosis(BaseModel):
    condition: str = Field(description="Name of the possible medical condition")
    likelihood: Literal['High', 'Moderate', 'Low'] = Field(description="Likelihood of this condition")
    reasoning: str = Field(description="Brief reasoning why this condition is suspected based on patient history")

class SOAPNote(BaseModel):
    subjective: str = Field(description="Patient's subjective report of symptoms and history")
    objective: str = Field(description="Objective observations (leave blank if none provided in history)")
    assessment: str = Field(description="Overall clinical assessment")
    plan: str = Field(description="Recommended plan, investigations, or next steps")

class PrakritiDosha(BaseModel):
    vata: int = Field(description="Vata percentage (0-100)", ge=0, le=100)
    pitta: int = Field(description="Pitta percentage (0-100)", ge=0, le=100)
    kapha: int = Field(description="Kapha percentage (0-100)", ge=0, le=100)

class PrakritiResult(BaseModel):
    primaryDosha: str = Field(description="Dominant Dosha (e.g. Vata, Pitta, Kapha)")
    secondaryDosha: Optional[str] = Field(description="Secondary Dosha if applicable, else None")
    percentages: PrakritiDosha = Field(description="Breakdown of dosha percentages adding up to 100")

class ClinicalSummaryResponse(BaseModel):
    chiefComplaint: str = Field(description="Concise 1-2 sentence chief complaint")
    hpiNarrative: str = Field(description="Detailed narrative of History of Present Illness (SOCRATES format if pain)")
    pastMedicalHistory: List[str] = Field(description="List of past medical conditions")
    currentMedications: List[str] = Field(description="List of current medications")
    allergies: List[str] = Field(description="List of allergies")
    reviewOfSystems: Dict[str, List[str]] = Field(description="Pertinent positives grouped by body system (e.g., {'Cardiovascular': ['Chest pain']})")
    differentials: List[DifferentialDiagnosis] = Field(description="Top 3 differential diagnoses")
    soapNote: SOAPNote = Field(description="Structured SOAP note")
    prakritiResult: Optional[PrakritiResult] = Field(default=None, description="Only populated if the interview was in AYUSH mode")

class AnalyzeRequest(BaseModel):
    mode: Literal['modern', 'ayush']
    chiefComplaint: str
    hpiNarrative: str
    pastMedicalHistory: List[str]
    currentMedications: List[str]
    allergies: List[str]
    reviewOfSystems: Dict[str, List[str]]
    familyHistory: List[str] = []
    socialHistory: Optional[Dict[str, str]] = None
    redFlagAlerts: List[dict] = []
    socratesAssessment: Optional[dict] = None
    prakritiResult: Optional[dict] = None
