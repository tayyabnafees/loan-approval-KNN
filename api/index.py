import os
import json
import joblib
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

app = FastAPI(
    title="Loan Approval Prediction API",
    description="FastAPI backend serving a KNN model to predict loan approvals.",
    version="1.0.0"
)

# Enable CORS for Next.js frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model artifacts placeholders
model = None
scaler = None
metadata = None

@app.on_event("startup")
def load_artifacts():
    global model, scaler, metadata
    
    # Locate artifacts folder relative to this file's location to prevent CWD mismatches on serverless Vercel
    current_dir = os.path.dirname(os.path.abspath(__file__))
    artifacts_dir = os.path.join(current_dir, "model_artifacts")
    
    model_path = os.path.join(artifacts_dir, "model.joblib")
    scaler_path = os.path.join(artifacts_dir, "scaler.joblib")
    metadata_path = os.path.join(artifacts_dir, "metadata.json")
    
    if not (os.path.exists(model_path) and os.path.exists(scaler_path) and os.path.exists(metadata_path)):
        raise FileNotFoundError(
            f"Required model artifacts not found at '{artifacts_dir}'. "
            "Ensure 'model.joblib', 'scaler.joblib', and 'metadata.json' are present."
        )
        
    try:
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
        print("Model artifacts loaded successfully.")
    except Exception as e:
        print(f"Error loading model artifacts: {e}")
        raise RuntimeError(f"Failed to load model artifacts: {str(e)}")

# Define Pydantic request schema
class LoanApplicant(BaseModel):
    Gender: Optional[str] = Field(None, description="Gender (Male or Female)")
    Married: Optional[str] = Field(None, description="Married (Yes or No)")
    Dependents: Optional[str] = Field(None, description="Number of dependents (0, 1, 2, 3+)")
    Education: Optional[str] = Field(None, description="Education (Graduate or Not Graduate)")
    Self_Employed: Optional[str] = Field(None, description="Self Employed (Yes or No)")
    ApplicantIncome: Optional[float] = Field(None, description="Monthly applicant income (integer/float)")
    CoapplicantIncome: Optional[float] = Field(None, description="Monthly co-applicant income (integer/float)")
    LoanAmount: Optional[float] = Field(None, description="Loan amount (in thousands, e.g., 120)")
    Loan_Amount_Term: Optional[float] = Field(None, description="Loan term in days/months (e.g., 360)")
    Credit_History: Optional[float] = Field(None, description="Credit history (1.0 = Good, 0.0 = Bad)")
    Property_Area: Optional[str] = Field(None, description="Property area (Urban, Semiurban, or Rural)")

class PredictionResponse(BaseModel):
    prediction: str
    probability: float
    status_code: int

@app.get("/")
@app.get("/api")
def read_root():
    return {"message": "Loan Approval Prediction API is running."}

@app.post("/predict", response_model=PredictionResponse)
@app.post("/api/predict", response_model=PredictionResponse)
def predict_loan(applicant: LoanApplicant):
    if model is None or scaler is None or metadata is None:
        raise HTTPException(status_code=503, detail="Model is not loaded.")
        
    try:
        # 1. Convert input Pydantic schema to dict
        input_data = applicant.dict()
        
        # 2. Impute missing values using training set modes/medians
        imputation_values = metadata['imputation_values']
        for col, default_val in imputation_values.items():
            if input_data.get(col) is None or input_data.get(col) == "":
                input_data[col] = default_val
                
        # 3. Reconstruct the encoded feature vector matching metadata['encoded_columns']
        encoded_cols = metadata['encoded_columns']
        df_encoded = pd.DataFrame(0.0, index=[0], columns=encoded_cols)
        
        # Fill numerical features
        for col in metadata['num_cols']:
            df_encoded.at[0, col] = float(input_data[col])
            
        # Fill categorical features (using dummy mapping format 'ColName_Category')
        for col in metadata['cat_cols']:
            category_val = str(input_data[col])
            dummy_col = f"{col}_{category_val}"
            if dummy_col in df_encoded.columns:
                df_encoded.at[0, dummy_col] = 1.0
                
        # 4. Scale features using the fit StandardScaler
        scaled_features = scaler.transform(df_encoded)
        
        # 5. Predict using the KNN classifier
        pred_class = int(model.predict(scaled_features)[0])
        probabilities = model.predict_proba(scaled_features)[0]  # [prob_rejected, prob_approved]
        
        # Convert prediction binary back to string status
        prediction_label = "Approved" if pred_class == 1 else "Rejected"
        approval_prob = float(probabilities[1])  # Probability of class 1 (Approved)
        
        return PredictionResponse(
            prediction=prediction_label,
            probability=approval_prob,
            status_code=200
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")
