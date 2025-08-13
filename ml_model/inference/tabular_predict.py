import os
import pickle
import numpy as np

# Paths relative to this file
MODEL_PATH = os.path.join(os.path.dirname(__file__), '..', 'saved-model', 'diabetes_model.pkl')
SCALER_PATH = os.path.join(os.path.dirname(__file__), '..', 'saved-model', 'diabetes_scaler.pkl')

# Load model and scaler once
with open(MODEL_PATH, 'rb') as f:
    diabetes_model = pickle.load(f)

with open(SCALER_PATH, 'rb') as f:
    scaler = pickle.load(f)

def predict_diabetes(features):
    """
    Predict diabetes given feature list:
    [Pregnancies, Glucose, BloodPressure, SkinThickness, Insulin, BMI, DiabetesPedigreeFunction, Age]
    """
    features = np.array(features).reshape(1, -1)
    features_scaled = scaler.transform(features)
    prediction = diabetes_model.predict(features_scaled)[0]
    return int(prediction)
        