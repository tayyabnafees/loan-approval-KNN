import os
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import KNeighborsClassifier
from imblearn.over_sampling import SMOTE

def train_and_save():
    print("--- Starting Model Training ---")
    
    # 1. Load data
    data_path = '../data.csv'
    if not os.path.exists(data_path):
        data_path = 'data.csv'  # Fallback if running from root
        
    df = pd.read_csv(data_path)
    
    # Drop Loan_ID
    if 'Loan_ID' in df.columns:
        df = df.drop(columns=['Loan_ID'])
        
    y = df['Loan_Status'].map({'Y': 1, 'N': 0})
    X = df.drop(columns=['Loan_Status'])
    
    # Identify numerical and categorical columns
    num_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = X.select_dtypes(exclude=[np.number]).columns.tolist()
    
    # Determine imputation values
    imputation_values = {}
    for col in num_cols:
        median_val = X[col].median()
        X[col] = X[col].fillna(median_val)
        imputation_values[col] = float(median_val)
        
    for col in cat_cols:
        mode_val = X[col].mode().iloc[0]
        X[col] = X[col].fillna(mode_val)
        imputation_values[col] = str(mode_val)
        
    # Dummy encoding
    X_encoded = pd.get_dummies(X, columns=cat_cols, drop_first=True)
    encoded_columns = X_encoded.columns.tolist()
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X_encoded, y, test_size=0.2, random_state=42)
    
    # Balance classes with SMOTE
    smote = SMOTE(sampling_strategy=0.8, random_state=42)
    X_train_balanced, y_train_balanced = smote.fit_resample(X_train, y_train)
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_balanced)
    X_test_scaled = scaler.transform(X_test)
    
    # Train KNN model with optimized parameters from notebook
    best_knn = KNeighborsClassifier(metric='manhattan', n_neighbors=18, weights='distance')
    best_knn.fit(X_train_scaled, y_train_balanced)
    
    # Evaluate model accuracy on test set
    y_pred = best_knn.predict(X_test_scaled)
    accuracy = (y_pred == y_test).mean()
    print(f"Model trained. Accuracy: {accuracy:.4f}")
    
    # Create artifacts directory and save model, scaler, and metadata
    os.makedirs('model_artifacts', exist_ok=True)
    joblib.dump(best_knn, 'model_artifacts/model.joblib')
    joblib.dump(scaler, 'model_artifacts/scaler.joblib')
    
    # Store metadata for deployment preprocessing
    metadata = {
        'num_cols': num_cols,
        'cat_cols': cat_cols,
        'imputation_values': imputation_values,
        'encoded_columns': encoded_columns
    }
    
    with open('model_artifacts/metadata.json', 'w') as f:
        json.dump(metadata, f, indent=4)
        
    print("Artifacts saved in backend/model_artifacts/")

if __name__ == "__main__":
    train_and_save()
