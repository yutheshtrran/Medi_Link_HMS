import os
import pickle
import pandas as pd
from flask import Blueprint, request, jsonify
import traceback

# ---------------------------------------------------
# 1. Blueprint & Model Path Setup
# ---------------------------------------------------
ckd_bp = Blueprint('ckd_bp', __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..', '..'))
MODEL_PATH = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model', 'ckd_model.pkl')

ckd_model = None
try:
    with open(MODEL_PATH, 'rb') as f:
        ckd_model = pickle.load(f)
    print(f"✅ CKD model loaded successfully from: {MODEL_PATH}")
except FileNotFoundError:
    print(f"⚠️ CKD model file not found at {MODEL_PATH}")
except Exception as e:
    print(f"❌ Error loading CKD model: {e}")
    traceback.print_exc()

# ---------------------------------------------------
# 2. Feature Definitions
# ---------------------------------------------------
EXPECTED_FEATURES = [
    "age", "Blood Pressure", "Specific Gravity", "Albumin", "Sugar",
    "Blood Glucose Random", "Blood Urea", "Serum Creatinine", "Sodium",
    "Potassium", "Hemoglobin", "Packed Cell Volume",
    "White Blood Cell Count", "Red Blood Cell Count",
    "Pus Cell", "Pus Cell clumps", "Bacteria",
    "Hypertension", "Diabetes Mellitus", "Coronary Artery Disease",
    "Appetite", "Pedal Edema", "Anemia"
]

NUMERIC_FEATURES = [
    'age', 'blood pressure', 'specific gravity', 'albumin', 'sugar',
    'blood glucose random', 'blood urea', 'serum creatinine', 'sodium',
    'potassium', 'hemoglobin', 'packed cell volume',
    'white blood cell count', 'red blood cell count'
]

CATEGORICAL_FEATURES = [
    'pus cell', 'pus cell clumps', 'bacteria',
    'hypertension', 'diabetes mellitus', 'coronary artery disease',
    'appetite', 'pedal edema', 'anemia'
]

# ---------------------------------------------------
# 3. Prediction Endpoint
# ---------------------------------------------------
@ckd_bp.route('/predict-ckd', methods=['POST'])
def predict_ckd():
    """Predicts CKD risk using the trained pipeline."""
    if ckd_model is None:
        return jsonify(error="CKD model not loaded."), 500

    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify(error="No input data received."), 400

        # Check for missing fields
        missing = [f for f in EXPECTED_FEATURES if f not in data or data[f] in [None, ""]]
        if missing:
            return jsonify(error=f"Missing input fields: {', '.join(missing)}"), 400

        # Prepare input DataFrame
        input_df = pd.DataFrame([data])
        input_df.columns = input_df.columns.str.strip().str.lower()

        # Convert numeric features
        for col in NUMERIC_FEATURES:
            if col in input_df.columns:
                input_df[col] = pd.to_numeric(input_df[col], errors='coerce')

        # Clean categorical features
        for col in CATEGORICAL_FEATURES:
            if col in input_df.columns:
                input_df[col] = input_df[col].astype(str).str.strip().str.lower()

        # Predict
        prediction = int(ckd_model.predict(input_df)[0])
        prediction_proba = ckd_model.predict_proba(input_df)[0, 1]

        # Map to risk levels
        if prediction == 1 or prediction_proba >= 0.65:
            risk = "High"
            reason = "High risk of Chronic Kidney Disease. Immediate medical attention is advised."
        elif prediction_proba >= 0.35:
            risk = "Medium"
            reason = "Moderate risk. Regular check-ups recommended."
        else:
            risk = "Low"
            reason = "Low risk of CKD. Maintain a healthy lifestyle."

        return jsonify({
            "prediction": prediction,
            "probability": float(prediction_proba),
            "risk_level": risk,
            "reason": reason
        })

    except Exception as e:
        print(f"❌ Error during CKD prediction: {e}")
        traceback.print_exc()
        return jsonify(error=f"Internal server error: {str(e)}"), 500
import os
import pickle
import pandas as pd
from flask import Blueprint, request, jsonify
import traceback

# ---------------------------------------------------
# 1. Blueprint & Model Path Setup
# ---------------------------------------------------
ckd_bp = Blueprint('ckd_bp', __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..', '..'))
MODEL_PATH = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model', 'ckd_model.pkl')

ckd_model = None
try:
    with open(MODEL_PATH, 'rb') as f:
        ckd_model = pickle.load(f)
    print(f"✅ CKD model loaded successfully from: {MODEL_PATH}")
except FileNotFoundError:
    print(f"⚠️ CKD model file not found at {MODEL_PATH}")
except Exception as e:
    print(f"❌ Error loading CKD model: {e}")
    traceback.print_exc()

# ---------------------------------------------------
# 2. Feature Definitions
# ---------------------------------------------------
EXPECTED_FEATURES = [
    "age", "Blood Pressure", "Specific Gravity", "Albumin", "Sugar",
    "Blood Glucose Random", "Blood Urea", "Serum Creatinine", "Sodium",
    "Potassium", "Hemoglobin", "Packed Cell Volume",
    "White Blood Cell Count", "Red Blood Cell Count",
    "Pus Cell", "Pus Cell clumps", "Bacteria",
    "Hypertension", "Diabetes Mellitus", "Coronary Artery Disease",
    "Appetite", "Pedal Edema", "Anemia"
]

NUMERIC_FEATURES = [
    'age', 'blood pressure', 'specific gravity', 'albumin', 'sugar',
    'blood glucose random', 'blood urea', 'serum creatinine', 'sodium',
    'potassium', 'hemoglobin', 'packed cell volume',
    'white blood cell count', 'red blood cell count'
]

CATEGORICAL_FEATURES = [
    'pus cell', 'pus cell clumps', 'bacteria',
    'hypertension', 'diabetes mellitus', 'coronary artery disease',
    'appetite', 'pedal edema', 'anemia'
]

# ---------------------------------------------------
# 3. Prediction Endpoint
# ---------------------------------------------------
@ckd_bp.route('/predict-ckd', methods=['POST'])
def predict_ckd():
    """Predicts CKD risk using the trained pipeline."""
    if ckd_model is None:
        return jsonify(error="CKD model not loaded."), 500

    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify(error="No input data received."), 400

        # Check for missing fields
        missing = [f for f in EXPECTED_FEATURES if f not in data or data[f] in [None, ""]]
        if missing:
            return jsonify(error=f"Missing input fields: {', '.join(missing)}"), 400

        # Prepare input DataFrame
        input_df = pd.DataFrame([data])
        input_df.columns = input_df.columns.str.strip().str.lower()

        # Convert numeric features
        for col in NUMERIC_FEATURES:
            if col in input_df.columns:
                input_df[col] = pd.to_numeric(input_df[col], errors='coerce')

        # Clean categorical features
        for col in CATEGORICAL_FEATURES:
            if col in input_df.columns:
                input_df[col] = input_df[col].astype(str).str.strip().str.lower()

        # Predict
        prediction = int(ckd_model.predict(input_df)[0])
        prediction_proba = ckd_model.predict_proba(input_df)[0, 1]

        # Map to risk levels
        if prediction == 1 or prediction_proba >= 0.65:
            risk = "High"
            reason = "High risk of Chronic Kidney Disease. Immediate medical attention is advised."
        elif prediction_proba >= 0.35:
            risk = "Medium"
            reason = "Moderate risk. Regular check-ups recommended."
        else:
            risk = "Low"
            reason = "Low risk of CKD. Maintain a healthy lifestyle."

        return jsonify({
            "prediction": prediction,
            "probability": float(prediction_proba),
            "risk_level": risk,
            "reason": reason
        })

    except Exception as e:
        print(f"❌ Error during CKD prediction: {e}")
        traceback.print_exc()
        return jsonify(error=f"Internal server error: {str(e)}"), 500
