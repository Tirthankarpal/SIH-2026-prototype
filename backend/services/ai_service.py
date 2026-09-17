import os
import json
from google import genai
from google.genai import types
from schemas import ClinicalSummaryResponse, AnalyzeRequest

# Initialize client. It will automatically pick up GEMINI_API_KEY from environment
client = genai.Client(api_key=os.environ.get("VITE_GEMINI_API_KEY", os.environ.get("GEMINI_API_KEY")))

def analyze_clinical_encounter(request: AnalyzeRequest) -> ClinicalSummaryResponse:
    """
    Takes the raw answers dictionary from the frontend and uses Gemini
    with strict Pydantic v2 schema enforcement to return a valid ClinicalSummaryResponse.
    """
    
    # Format the answers into a readable transcript for the LLM
    transcript = f"Chief Complaint: {request.chiefComplaint}\n"
    transcript += f"HPI: {request.hpiNarrative}\n"
    transcript += f"Past Medical History: {', '.join(request.pastMedicalHistory) if request.pastMedicalHistory else 'None'}\n"
    transcript += f"Medications: {', '.join(request.currentMedications) if request.currentMedications else 'None'}\n"
    transcript += f"Allergies: {', '.join(request.allergies) if request.allergies else 'None'}\n"
    
    if request.reviewOfSystems:
        transcript += "Review of Systems:\n"
        for sys, findings in request.reviewOfSystems.items():
            transcript += f"  - {sys}: {', '.join(findings)}\n"
            
    if request.socratesAssessment:
        transcript += f"SOCRATES: {json.dumps(request.socratesAssessment)}\n"

    system_instruction = """
    You are an expert Medical AI Assistant.
    Analyze the provided patient interview transcript and generate a structured clinical summary.
    Extract the Chief Complaint, History of Present Illness (HPI), Past Medical History, Medications, and Allergies.
    Group any pertinent positive symptoms into the Review of Systems.
    Provide top 3 differential diagnoses with likelihoods.
    Generate a concise SOAP note.
    """

    if request.mode == 'ayush':
        system_instruction += """
        IMPORTANT: The patient is undergoing an AYUSH (Ayurveda) consultation using the Dashavidha Pariksha framework.
        You MUST calculate their Prakriti (Vata, Pitta, Kapha) based on their answers regarding sleep, digestion, body frame, and mental stamina.
        Populate the `prakritiResult` field accurately.
        """
    else:
        system_instruction += """
        This is a Modern Medicine consultation. Do NOT populate the `prakritiResult` field. Set it to null.
        """

    schema_instruction = """
    You must return a valid JSON object matching this exact schema:
    {
      "chiefComplaint": "string",
      "hpiNarrative": "string",
      "pastMedicalHistory": ["string"],
      "currentMedications": ["string"],
      "allergies": ["string"],
      "reviewOfSystems": {"SystemName": ["finding1", "finding2"]},
      "differentials": [
        {
          "condition": "string",
          "likelihood": "High" | "Moderate" | "Low",
          "reasoning": "string"
        }
      ],
      "soapNote": {
        "subjective": "string",
        "objective": "string (Pending physician examination)",
        "assessment": "string",
        "plan": "string"
      },
      "prakritiResult": {
        "primaryDosha": "string",
        "secondaryDosha": "string or null",
        "percentages": {"vata": 0, "pitta": 0, "kapha": 0}
      } // Only include prakritiResult if mode is ayush, otherwise null
    }
    """

    prompt = f"Patient Transcript:\n{transcript}\n\n{schema_instruction}\n\nPlease generate the structured clinical summary."

    response = client.models.generate_content(
        model='gemini-3.6-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            response_mime_type="application/json",
            temperature=0.1
        )
    )

    # Validate the raw JSON string strictly using Pydantic
    try:
        validated_response = ClinicalSummaryResponse.model_validate_json(response.text)
        return validated_response
    except Exception as e:
        print(f"Pydantic Validation Error: {e}")
        # If it fails, fallback to standard LLM extraction error handling
        raise ValueError(f"AI returned invalid schema: {e}")
