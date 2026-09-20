import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/abdm/v0.5", tags=["ABDM Sandbox Mock"])

class AuthInitRequest(BaseModel):
    authMethod: str = "MOBILE_OTP"
    healthid: str

class AuthConfirmRequest(BaseModel):
    transactionId: str
    credential: str # OTP

@router.post("/users/auth/init")
def auth_init(request: AuthInitRequest):
    """
    Mock NHA Gateway /users/auth/init endpoint.
    Accepts an ABHA ID or phone number, and returns a transactionId.
    """
    if not request.healthid:
        raise HTTPException(status_code=400, detail="Health ID is required")
        
    return {
        "transactionId": str(uuid.uuid4()),
        "authMode": request.authMethod
    }

@router.post("/users/auth/confirm")
def auth_confirm(request: AuthConfirmRequest):
    """
    Mock NHA Gateway /users/auth/confirm endpoint.
    Validates OTP (accepts any 6-digit number in mock mode) and returns demographics.
    """
    if not request.credential or len(request.credential) != 6:
        raise HTTPException(status_code=400, detail="Invalid OTP. Must be 6 digits.")
        
    # Return mock ABDM profile data format
    return {
        "authResult": "SUCCESS",
        "token": f"mock-jwt-token-{uuid.uuid4()}",
        "patient": {
            "id": f"abha-{uuid.uuid4().hex[:8]}",
            "name": "Arjun Kumar",
            "gender": "M",
            "yearOfBirth": 1985,
            "monthOfBirth": 6,
            "dayOfBirth": 15,
            "address": {
                "line": "123 MG Road",
                "district": "Bangalore Urban",
                "state": "Karnataka",
                "pincode": "560001"
            },
            "identifiers": [
                {
                    "type": "MOBILE",
                    "value": "+919876543210"
                }
            ]
        }
    }
