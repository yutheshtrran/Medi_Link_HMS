import os
import pickle
import traceback
import pandas as pd
from flask import Blueprint, request, jsonify

# --------------------------------------------
# 🔷 Liver Disease Blueprint
# --------------------------------------------
liver_bp = Blueprint('liver_bp', __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..', '..'))
MODEL_PATH = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model', 'liver_disease_model.pkl')
PREPROCESSOR_PATH = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model', 'liver_disease_preprocessor.pkl')

liver_model = None
liver_preprocessor = None

# --------------------------------------------
# 🔄 Load Model and Preprocessor
# --------------------------------------------
try:
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, 'rb') as f:
            liver_model = pickle.load(f)
        print(f"✅ Liver Disease model loaded successfully from: {MODEL_PATH}")
    else:
        print(f"⚠️ Model not found at: {MODEL_PATH}")

    if os.path.exists(PREPROCESSOR_PATH):
        with open(PREPROCESSOR_PATH, 'rb') as f:
            liver_preprocessor = pickle.load(f)
        print(f"✅ Liver Disease preprocessor loaded successfully from: {PREPROCESSOR_PATH}")
    else:
        print(f"⚠️ Preprocessor not found at: {PREPROCESSOR_PATH}")

except Exception as e:
    print(f"❌ Error loading liver model or preprocessor: {e}")
    traceback.print_exc()


# --------------------------------------------
# 📦 Prediction Endpoint
# --------------------------------------------
@liver_bp.route('/predict-liver-disease', methods=['POST'])
def predict_liver_disease():
    """Predict liver disease risk using ML model."""
    if liver_model is None:
        return jsonify(error="Liver disease model not loaded."), 500

    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify(error="No input data received."), 400

        # 🔹 Normalize keys
        normalized = {k.lower().strip().replace(" ", "_"): v for k, v in data.items()}

        # 🔹 Exact columns expected by the model/preprocessor
        expected_columns = [
            'age',
            'gender',
            'total_bilirubin',
            'direct_bilirubin',
            'alkaline_phosphotase',
            'alamine_aminotransferase',
            'aspartate_aminotransferase',
            'total_protiens',
            'albumin',
            'albumin_and_globulin_ratio'
        ]

        # 🔹 Create DataFrame with all expected columns in correct order
        input_dict = {col: normalized.get(col, None) for col in expected_columns}
        input_df = pd.DataFrame([input_dict])

        print(f"📊 Input DataFrame before conversion:\n{input_df}")

        # 🔹 Handle types
        input_df['gender'] = input_df['gender'].astype(str).str.strip().str.lower()
        num_cols = [c for c in expected_columns if c != 'gender']
        input_df[num_cols] = input_df[num_cols].apply(pd.to_numeric, errors='coerce')

        if input_df.isnull().any().any():
            print("⚠️ Warning: NaN values detected after conversion. Will rely on imputation if defined.")

        # 🔹 Apply preprocessor if required
        try:
            processed_input = liver_preprocessor.transform(input_df)
            print("✅ Input successfully transformed with preprocessor.")
        except Exception as ex:
            print(f"ℹ️ Skipping preprocessor (already in model pipeline or mismatch): {ex}")
            processed_input = input_df

        # 🔹 Predict
        try:
            prediction = int(liver_model.predict(processed_input)[0])
        except Exception as ex:
            print(f"⚠️ Prediction with processed input failed, trying raw input: {ex}")
            prediction = int(liver_model.predict(input_df)[0])

        # 🔹 Try probability if supported
        prediction_proba = None
        try:
            if hasattr(liver_model, "predict_proba"):
                prediction_proba = float(liver_model.predict_proba(processed_input)[0, 1])
        except Exception:
            pass

        # 🔹 Interpret the result
        if prediction == 1 or (prediction_proba and prediction_proba >= 0.6):
            risk = "High"
            message = "High risk of liver disease detected. Please consult a doctor."
        elif prediction_proba and prediction_proba >= 0.4:
            risk = "Medium"
            message = "Moderate risk detected. Consider medical checkup."
        else:
            risk = "Low"
            message = "Low risk detected. Maintain a healthy lifestyle."

        return jsonify({
            "prediction": prediction,
            "probability": prediction_proba,
            "risk_level": risk,
            "message": message
        })

    except Exception as e:
        print(f"❌ Error during liver disease prediction: {e}")
        traceback.print_exc()
        return jsonify(error=f"Internal server error during liver prediction: {str(e)}"), 500
