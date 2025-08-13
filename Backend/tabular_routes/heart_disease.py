import os
import pickle
from flask import Blueprint, request, jsonify
import pandas as pd

# Create a Blueprint for heart disease routes
heart_bp = Blueprint('heart_bp', __name__)

# Determine the project root dynamically
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Go up two levels from tabular_routes/heart_disease.py to reach the project root (Medi_Link/)
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..', '..'))

# Paths for Heart Disease tabular model and scaler
# CORRECTED: Changed 'heart_model.pkl' to 'heart_disease_model.pkl'
HEART_DISEASE_TABULAR_MODEL_PATH = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model', 'heart_disease_model.pkl')
HEART_DISEASE_SCALER_PATH = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model', 'heart_disease_scaler.pkl')

heart_disease_tabular_model = None
heart_disease_scaler = None

# Load models and scalers when the blueprint is initialized
try:
    if os.path.exists(HEART_DISEASE_TABULAR_MODEL_PATH):
        with open(HEART_DISEASE_TABULAR_MODEL_PATH, 'rb') as f:
            heart_disease_tabular_model = pickle.load(f)
        print("✅ Heart Disease tabular model loaded successfully within blueprint.")
    else:
        print(f"⚠️ Warning: Heart Disease tabular model not found at {HEART_DISEASE_TABULAR_MODEL_PATH}")

    if os.path.exists(HEART_DISEASE_SCALER_PATH):
        with open(HEART_DISEASE_SCALER_PATH, 'rb') as f:
            heart_disease_scaler = pickle.load(f)
        print("✅ Heart Disease scaler loaded successfully within blueprint.")
    else:
        print(f"⚠️ Warning: Heart Disease scaler not found at {HEART_DISEASE_SCALER_PATH}. Prediction might be inaccurate if scaling was used during training.")

except Exception as e:
    print(f"❌ Error loading Heart Disease model/scaler within blueprint: {e}")
    heart_disease_tabular_model = None
    heart_disease_scaler = None

@heart_bp.route('/predict-heart-disease', methods=['POST'])
def predict_heart_disease():
    """
    Handles heart disease predictions using the loaded tabular ML model.
    """
    form_data = request.json
    print(f"DEBUG (Heart Disease Blueprint): Raw incoming JSON: {form_data}")

    if not heart_disease_tabular_model or not heart_disease_scaler:
        return jsonify({"message": "Heart Disease prediction model or scaler not loaded in blueprint."}), 500

    expected_features = [
        'age', 'sex', 'Chest Pain (Numbers)', 'Trestbps (Resting Blood Pressure)',
        'Cholesterol', 'Fasting Blood Sugar', 'Resting Electrocardiographic Results',
        'Maximum Heart Rate Achieved', 'Exercise Induced Angina',
        'ST Depression Induced by Exercise Relative to Rest',
        'Slope of the Peak Exercise ST Segment',
        'Number of Major Vessels Colored by Flouroscopy', 'Thallium Stress Test Result'
    ]

    input_values = {}
    for key in expected_features:
        val = form_data.get(key)
        if val is None:
            print(f"Missing key in form_data for Heart Disease: {key}")
            return jsonify({"error": f"Missing data for {key}"}), 400

        # Convert 'male'/'female' to 0/1 for 'sex'
        if key == 'sex':
            input_values[key] = 0 if val == 'male' else 1
        # Convert string '0'/'1' to int for specific features
        elif key in ['Fasting Blood Sugar', 'Exercise Induced Angina',
                      'Resting Electrocardiographic Results', 'Slope of the Peak Exercise ST Segment',
                      'Thallium Stress Test Result']:
            try:
                input_values[key] = int(val)
            except ValueError:
                print(f"Invalid integer value for {key}: {val}")
                return jsonify({"error": f"Invalid integer value for {key}"}), 400
        else:
            try:
                input_values[key] = float(val)
            except ValueError:
                print(f"Invalid numerical value for {key}: {val}")
                return jsonify({"error": f"Invalid numerical value for {key}"}), 400

    input_df = pd.DataFrame([input_values])
    print(f"DEBUG (Heart Disease Blueprint): Input DataFrame for scaler:\n{input_df}")

    processed_input = input_df
    try:
        processed_input = heart_disease_scaler.transform(input_df)
        print("✅ Heart Disease input scaled successfully.")
        print(f"DEBUG (Heart Disease Blueprint): Scaled processed_input:\n{processed_input}")
    except Exception as scaler_error:
        print(f"❌ Error applying scaler to Heart Disease input: {scaler_error}")
        return jsonify({"error": f"Error during data scaling: {str(scaler_error)}"}), 500
    
    try:
        prediction = heart_disease_tabular_model.predict(processed_input)[0]
        return jsonify({"prediction": int(prediction)})

    except Exception as e:
        print(f"Error during heart disease prediction: {e}")
        return jsonify({"error": f"An error occurred during heart disease prediction: {str(e)}"}), 500
