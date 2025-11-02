import os
import pickle
import traceback
import pandas as pd
from flask import Blueprint, request, jsonify

# ---------------------------------------------------
# 🔷 Hypertension Blueprint
# ---------------------------------------------------
hypertension_bp = Blueprint('hypertension_bp', __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..', '..'))
MODEL_PATH = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model', 'hypertension_model.pkl')
PREPROCESSOR_PATH = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model', 'hypertension_preprocessor.pkl')

hypertension_model = None
hypertension_preprocessor = None

# ---------------------------------------------------
# 🔄 Load Model and Preprocessor
# ---------------------------------------------------
try:
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, 'rb') as f:
            hypertension_model = pickle.load(f)
        print(f"✅ Hypertension model loaded successfully from: {MODEL_PATH}")
    else:
        print(f"⚠️ Model not found at: {MODEL_PATH}")

    if os.path.exists(PREPROCESSOR_PATH):
        with open(PREPROCESSOR_PATH, 'rb') as f:
            hypertension_preprocessor = pickle.load(f)
        print(f"✅ Hypertension preprocessor loaded successfully from: {PREPROCESSOR_PATH}")
    else:
        print(f"⚠️ Preprocessor not found at: {PREPROCESSOR_PATH}")

except Exception as e:
    print(f"❌ Error loading hypertension model or preprocessor: {e}")
    traceback.print_exc()


# ---------------------------------------------------
# 📦 Prediction Endpoint
# ---------------------------------------------------
@hypertension_bp.route('/predict-hypertension', methods=['POST'])
def predict_hypertension():
    """Predict Hypertension likelihood using ML model."""
    if hypertension_model is None:
        return jsonify(error="Hypertension model not loaded."), 500

    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify(error="No input data received."), 400

        expected_features = [
            'Age_yrs', 'Gender', 'Education_Level', 'Occupation',
            'Physical_Activity', 'Smoking_Habits', 'BMI'
        ]

        # Filter to only expected features
        clean_data = {k: data.get(k, None) for k in expected_features}

        # Check for missing values
        missing = [f for f in expected_features if clean_data[f] in [None, ""]]
        if missing:
            return jsonify(error=f"Missing fields: {', '.join(missing)}"), 400

        # Create DataFrame
        input_df = pd.DataFrame([clean_data])

        # Standardize categorical + numeric types
        categorical_cols = ['Gender', 'Education_Level', 'Occupation', 'Physical_Activity', 'Smoking_Habits']
        numerical_cols = ['Age_yrs', 'BMI']

        for col in categorical_cols:
            input_df[col] = input_df[col].astype(str).str.strip().str.lower()
        for col in numerical_cols:
            input_df[col] = pd.to_numeric(input_df[col], errors='coerce')

        print(f"🧩 Final input before prediction:\n{input_df}\n")

        # 🚫 Don't transform if model already includes preprocessor
        try:
            prediction = int(hypertension_model.predict(input_df)[0])
        except ValueError as ve:
            print("⚠️ Model expects preprocessed input. Falling back to external preprocessor...")
            processed_input = hypertension_preprocessor.transform(input_df)
            prediction = int(hypertension_model.predict(processed_input)[0])

        # Probability (if available)
        prediction_proba = (
            float(hypertension_model.predict_proba(input_df)[0, 1])
            if hasattr(hypertension_model, "predict_proba")
            else None
        )

        # Risk Interpretation
        if prediction == 1 or (prediction_proba and prediction_proba >= 0.6):
            risk = "High"
            reason = "High risk of hypertension detected. Medical evaluation is recommended."
        elif prediction_proba and prediction_proba >= 0.4:
            risk = "Medium"
            reason = "Moderate risk detected. Monitor blood pressure regularly."
        else:
            risk = "Low"
            reason = "Low risk of hypertension detected. Continue healthy habits."

        return jsonify({
            "prediction": prediction,
            "probability": prediction_proba,
            "risk_level": risk,
            "reason": reason
        })

    except Exception as e:
        print(f"❌ Error during hypertension prediction: {e}")
        traceback.print_exc()
        return jsonify(error=f"Internal server error during prediction: {str(e)}"), 500
