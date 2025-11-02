from flask import Blueprint, request, jsonify
import pickle
import pandas as pd
import numpy as np
import os
import sys
import traceback

# ------------------------
# Path setup
# ------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..', '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

cancer_bp = Blueprint('cancer_bp', __name__)

# ------------------------
# Model Loading
# ------------------------
MODEL_PATH = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model', 'cancer_model.pkl')
PREPROCESSOR_PATH = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model', 'cancer_preprocessor.pkl')

cancer_model, cancer_preprocessor = None, None

try:
    with open(MODEL_PATH, 'rb') as f:
        cancer_model = pickle.load(f)
    with open(PREPROCESSOR_PATH, 'rb') as f:
        cancer_preprocessor = pickle.load(f)
    print(f"✅ Cancer model and preprocessor loaded successfully.")
except FileNotFoundError:
    print(f"⚠️ Cancer model or preprocessor file not found in {MODEL_PATH}")
except Exception as e:
    print(f"❌ Error loading Cancer model: {e}")
    traceback.print_exc()

# ------------------------
# Expected Input Features
# ------------------------
EXPECTED_FEATURES = [
    'age', 'gender', 'familyhistorycancer', 'smokingstatus', 'alcoholconsumption',
    'bmi', 'physicalactivity_hoursperweek', 'chronicdisease_hypertension', 
    'chronicdisease_diabetes', 'genomicmarker_1', 'genomicmarker_2', 'tumorsize_mm',
    'biopsyresult', 'bloodtest_markera', 'bloodtest_markerb', 'symptoms_fatigue',
    'symptoms_unexplainedweightloss'
]

# ------------------------
# Categorical Mappings
# ------------------------
CATEGORY_MAPPINGS = {
    'gender': {'male': 0, 'female': 1},
    'smokingstatus': {'never smoked': 0, 'former smoker': 1, 'current smoker': 2},
    'alcoholconsumption': {'none': 0, 'moderate': 1, 'heavy': 2},
    'biopsyresult': {'benign': 0, 'malignant': 1, 'not performed': 2, 'atypical': 3},
    'familyhistorycancer': {'0': 0, '1': 1},
    'chronicdisease_hypertension': {'0': 0, '1': 1},
    'chronicdisease_diabetes': {'0': 0, '1': 1},
    'symptoms_fatigue': {'0': 0, '1': 1},
    'symptoms_unexplainedweightloss': {'0': 0, '1': 1},
}

# ------------------------
# Prediction Route
# ------------------------
@cancer_bp.route('/predict-cancer', methods=['POST'])
def predict_cancer():
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify(error="Empty input data", risk_level="Error"), 400

        # Normalize keys
        data = {k.lower(): v for k, v in data.items()}

        # Validate all expected inputs
        missing = [f for f in EXPECTED_FEATURES if f not in data or data[f] in [None, ""]]
        if missing:
            return jsonify(error=f"Missing fields: {', '.join(missing)}"), 400

        # Prepare input DataFrame
        input_values = []
        for feature in EXPECTED_FEATURES:
            val = data[feature]
            if feature in CATEGORY_MAPPINGS:
                mapped = CATEGORY_MAPPINGS[feature].get(str(val).lower())
                if mapped is None:
                    return jsonify(error=f"Invalid value for '{feature}': {val}"), 400
                input_values.append(mapped)
            else:
                try:
                    input_values.append(float(val))
                except ValueError:
                    return jsonify(error=f"Invalid numeric value for '{feature}': {val}"), 400

        input_df = pd.DataFrame([input_values], columns=EXPECTED_FEATURES)

        if cancer_model is None or cancer_preprocessor is None:
            return jsonify(error="Model or preprocessor not loaded."), 500

        # Apply preprocessing + prediction
        X_processed = cancer_preprocessor.transform(input_df)
        prob = cancer_model.predict_proba(X_processed)[0, 1]

        # Determine risk level
        if prob < 0.35:
            risk, msg = 'Low', 'Low predicted risk. Maintain a healthy lifestyle.'
        elif prob < 0.65:
            risk, msg = 'Medium', 'Moderate risk. Consider consulting a doctor.'
        else:
            risk, msg = 'High', 'High risk. Seek immediate medical attention.'

        return jsonify(risk_level=risk, probability=float(prob), reason=msg)

    except Exception as e:
        print(f"❌ Error in /predict-cancer: {e}")
        traceback.print_exc()
        return jsonify(error=str(e), risk_level="Error"), 500
