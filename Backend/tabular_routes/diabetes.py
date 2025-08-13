import os
import pickle
from flask import Blueprint, request, jsonify
import pandas as pd

# Create a Blueprint for diabetes routes
diabetes_bp = Blueprint('diabetes_bp', __name__)

# Determine the project root dynamically
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Go up two levels from tabular_routes/diabetes.py to reach the project root (Medi_Link/)
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..', '..'))

# Paths for Diabetes tabular model
DIABETES_TABULAR_MODEL_PATH = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model', 'diabetes_model.pkl')
# If your diabetes model uses a scaler, define its path here and load it
# DIABETES_SCALER_PATH = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model', 'diabetes_scaler.pkl')

diabetes_tabular_model = None
# diabetes_scaler = None # Uncomment if you have a scaler for diabetes

# Load model when the blueprint is initialized
try:
    if os.path.exists(DIABETES_TABULAR_MODEL_PATH):
        with open(DIABETES_TABULAR_MODEL_PATH, 'rb') as f:
            diabetes_tabular_model = pickle.load(f)
        print("✅ Diabetes tabular model loaded successfully within blueprint.")
    else:
        print(f"⚠️ Warning: Diabetes tabular model not found at {DIABETES_TABULAR_MODEL_PATH}")

    # If you have a scaler for diabetes, load it here:
    # if os.path.exists(DIABETES_SCALER_PATH):
    #     with open(DIABETES_SCALER_PATH, 'rb') as f:
    #         diabetes_scaler = pickle.load(f)
    #     print("✅ Diabetes scaler loaded successfully within blueprint.")
    # else:
    #     print(f"⚠️ Warning: Diabetes scaler not found at {DIABETES_SCALER_PATH}. Prediction might be inaccurate.")

except Exception as e:
    print(f"❌ Error loading Diabetes model/scaler within blueprint: {e}")
    diabetes_tabular_model = None
    # diabetes_scaler = None

@diabetes_bp.route('/predict-diabetes', methods=['POST'])
def predict_diabetes():
    """
    Handles diabetes predictions using the loaded tabular ML model.
    """
    form_data = request.json
    print(f"DEBUG (Diabetes Blueprint): Raw incoming JSON: {form_data}")

    if not diabetes_tabular_model: # or (diabetes_scaler and not diabetes_scaler): # Check scaler if used
        return jsonify({"message": "Diabetes prediction model not loaded in blueprint."}), 500
    
    expected_features = [
        'Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness',
        'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age'
    ]
    
    input_values = {key: float(form_data.get(key, 0)) for key in expected_features}
    input_df = pd.DataFrame([input_values])

    processed_input = input_df
    # If your diabetes model uses a scaler, apply it here:
    # if diabetes_scaler:
    #     try:
    #         processed_input = diabetes_scaler.transform(input_df)
    #         print("✅ Diabetes input scaled successfully.")
    #     except Exception as scaler_error:
    #         print(f"❌ Error applying scaler to Diabetes input: {scaler_error}")
    #         return jsonify({"error": f"Error during data scaling: {str(scaler_error)}"}), 500

    try:
        prediction = diabetes_tabular_model.predict(processed_input)[0]
        return jsonify({"prediction": int(prediction)})

    except Exception as e:
        print(f"Error during diabetes prediction: {e}")
        return jsonify({"error": f"An error occurred during diabetes prediction: {str(e)}"}), 500
