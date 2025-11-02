import os
import pickle
import pandas as pd
from flask import Blueprint, request, jsonify
import traceback

# ---------------------------------------------------
# 1. Blueprint & Model Path Setup
# ---------------------------------------------------
diabetes_bp = Blueprint('diabetes_bp', __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..', '..'))
MODEL_PATH = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model', 'diabetes_model.pkl')

diabetes_model = None

try:
    with open(MODEL_PATH, 'rb') as f:
        diabetes_model = pickle.load(f)
    print(f"✅ Diabetes model loaded successfully from: {MODEL_PATH}")
except FileNotFoundError:
    print(f"⚠️ Diabetes model not found at {MODEL_PATH}")
except Exception as e:
    print(f"❌ Error loading Diabetes model: {e}")
    traceback.print_exc()

# ---------------------------------------------------
# 2. Prediction Endpoint
# ---------------------------------------------------
@diabetes_bp.route('/predict-diabetes', methods=['POST'])
def predict_diabetes():
    """Predict diabetes likelihood using the trained ML model."""
    if diabetes_model is None:
        return jsonify(error="Diabetes model not loaded."), 500

    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify(error="No input data received."), 400

        # Expected input features (must match training schema)
        expected_features = [
            'Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness',
            'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age'
        ]

        # Ensure all features exist
        missing = [f for f in expected_features if f not in data or data[f] in [None, ""]]
        if missing:
            return jsonify(error=f"Missing input fields: {', '.join(missing)}"), 400

        # Prepare DataFrame for prediction
        input_df = pd.DataFrame([{f: float(data[f]) for f in expected_features}])

        # Predict
        prediction = int(diabetes_model.predict(input_df)[0])
        prediction_proba = (
            float(diabetes_model.predict_proba(input_df)[0, 1])
            if hasattr(diabetes_model, "predict_proba")
            else None
        )

        # Risk interpretation
        if prediction == 1 or (prediction_proba and prediction_proba >= 0.6):
            risk = "High"
            reason = "High likelihood of diabetes. Medical evaluation is strongly advised."
        elif prediction_proba and prediction_proba >= 0.4:
            risk = "Medium"
            reason = "Moderate risk. Monitor your glucose levels and maintain a healthy lifestyle."
        else:
            risk = "Low"
            reason = "Low likelihood of diabetes. Continue regular check-ups."

        return jsonify({
            "prediction": prediction,
            "probability": prediction_proba,
            "risk_level": risk,
            "reason": reason
        })

    except Exception as e:
        print(f"❌ Error during diabetes prediction: {e}")
        traceback.print_exc()
        return jsonify(error=f"Internal server error: {str(e)}"), 500
