import os
import pickle
from flask import Blueprint, request, jsonify
import pandas as pd

# Create a Blueprint for heart disease routes
heart_bp = Blueprint('heart_bp', __name__)

# Determine the project root dynamically
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..', '..'))

# Model path
HEART_DISEASE_MODEL_PATH = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model', 'heart_disease_model.pkl')

# Load model
heart_model = None
try:
    if os.path.exists(HEART_DISEASE_MODEL_PATH):
        with open(HEART_DISEASE_MODEL_PATH, 'rb') as f:
            heart_model = pickle.load(f)
        print(f"✅ Heart Disease model loaded successfully from: {HEART_DISEASE_MODEL_PATH}")
    else:
        print(f"⚠️ Warning: Heart Disease model not found at {HEART_DISEASE_MODEL_PATH}")
except Exception as e:
    print(f"❌ Error loading Heart Disease model: {e}")

@heart_bp.route('/predict-heart-disease', methods=['POST'])
def predict_heart_disease():
    """
    Handles heart disease prediction using the loaded model.
    """
    if heart_model is None:
        return jsonify({"error": "Heart Disease model not loaded."}), 500

    try:
        data = request.get_json(force=True)
        print(f"🩺 Incoming Heart Disease JSON: {data}")

        # ✅ Normalize all keys to lowercase to avoid feature name mismatch
        data = {k.lower(): v for k, v in data.items()}

        # Expected features (all lowercase)
        expected_features = [
            'age', 'sex', 'chest pain (numbers)', 'trestbps (resting blood pressure)',
            'cholesterol', 'fasting blood sugar', 'resting electrocardiographic results',
            'maximum heart rate achieved', 'exercise induced angina',
            'st depression induced by exercise relative to rest',
            'slope of the peak exercise st segment',
            'number of major vessels colored by flouroscopy',
            'thallium stress test result'
        ]

        # Validate and prepare input
        input_values = {}
        for feature in expected_features:
            val = data.get(feature)
            if val is None:
                return jsonify({"error": f"Missing required field: {feature}"}), 400

            # Convert categorical/numeric fields appropriately
            if feature == 'sex':
                input_values[feature] = 0 if str(val).lower() == 'male' else 1
            else:
                try:
                    input_values[feature] = float(val)
                except ValueError:
                    return jsonify({"error": f"Invalid numeric value for {feature}: {val}"}), 400

        # Create DataFrame
        input_df = pd.DataFrame([input_values])

        # ✅ Ensure column names match exactly what model expects
        input_df.columns = input_df.columns.str.lower()

        print(f"✅ Final Heart Disease Input DataFrame:\n{input_df}")

        # Predict
        prediction = heart_model.predict(input_df)[0]

        # If model has predict_proba, also return confidence
        confidence = None
        if hasattr(heart_model, "predict_proba"):
            confidence = float(heart_model.predict_proba(input_df)[0][1])

        result = {"prediction": int(prediction)}
        if confidence is not None:
            result["confidence"] = round(confidence, 3)

        return jsonify(result)

    except Exception as e:
        print(f"❌ Error during heart disease prediction: {e}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500
