import os
import pickle
import pandas as pd
from flask import Blueprint, request, jsonify
import numpy as np # Import numpy for NaN checks and type conversions

# Define the Blueprint
ckd_bp = Blueprint('ckd_bp', __name__)

# Define paths for the CKD model and preprocessor
# Assuming models are saved in ml_model/saved-model relative to project root
BASE_DIR = os.path.dirname(os.path.abspath(__file__)) # Points to tabular_routes (e.g., D:\Medi_Link\Backend\tabular_routes)

# Go up two levels from BASE_DIR to reach the 'Medi_Link' project root
# D:\Medi_Link\Backend\tabular_routes -> D:\Medi_Link\Backend -> D:\Medi_Link
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..', '..'))
SAVE_MODEL_DIR = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model')

# IMPORTANT: This file MUST contain the full scikit-learn pipeline (preprocessor + classifier).
# If it only contains the classifier, the prediction will fail due to missing preprocessing steps.
CKD_MODEL_PATH = os.path.join(SAVE_MODEL_DIR, 'ckd_model.pkl')

ckd_model_pipeline = None

# Load the CKD model pipeline when the blueprint is initialized
# This ensures the model is loaded only once when the Flask app starts
try:
    if os.path.exists(CKD_MODEL_PATH):
        with open(CKD_MODEL_PATH, 'rb') as f:
            ckd_model_pipeline = pickle.load(f)
        print(f"✅ CKD model pipeline loaded successfully within blueprint.")
    else:
        print(f"⚠️ Warning: CKD model pipeline not found at {CKD_MODEL_PATH}. Prediction will not be available.")
except Exception as e:
    print(f"❌ Error loading CKD model pipeline: {e}")
    import traceback
    traceback.print_exc()

@ckd_bp.route('/predict-ckd', methods=['POST'])
def predict_ckd():
    """
    Predicts Chronic Kidney Disease risk based on input data.
    Expects a JSON payload with features matching the model's training data.
    """
    if ckd_model_pipeline is None:
        return jsonify({'error': 'CKD model not loaded. Cannot make predictions.'}), 500

    try:
        data = request.get_json(force=True) # force=True to handle cases where content-type might be slightly off

        # Define the expected feature order and types for the CKD model
        # These MUST match the features used during model training in train_disease_models.py
        # and the order expected by the pipeline's preprocessor.
        # Ensure these are the EXACT column names (case-sensitive) as they appear in the JSON payload
        # from the frontend, before any lowercasing/stripping on the backend.
        expected_features = [
            "age", "Blood Pressure", "Specific Gravity", "Albumin", "Sugar",
            "Blood Glucose Random", "Blood Urea", "Serum Creatinine", "Sodium",
            "Potassium", "Hemoglobin", "Packed Cell Volume",
            "White Blood Cell Count", "Red Blood Cell Count", # Numerical features
            "Pus Cell", "Pus Cell clumps", "Bacteria",
            "Hypertension", "Diabetes Mellitus", "Coronary Artery Disease",
            "Appetite", "Pedal Edema", "Anemia" # Categorical features
        ]

        # Create a dictionary to hold the input data, ensuring all expected features are present
        input_data = {}
        for feature in expected_features:
            value = data.get(feature)
            if value is None:
                # Handle missing features - you might want to return an error or impute
                return jsonify({'error': f"Missing input data for feature: '{feature}'"}), 400
            input_data[feature] = value

        # Convert input_data to a pandas DataFrame for prediction
        # The column names here will initially match the frontend's casing (e.g., "Blood Pressure")
        input_df = pd.DataFrame([input_data])

        # --- FIX: Lowercase and strip column names to match the trained pipeline's expectation ---
        input_df.columns = input_df.columns.str.strip().str.lower()
        print(f"DEBUG: Input DataFrame columns after lowercasing: {input_df.columns.tolist()}")


        # --- Apply necessary preprocessing steps manually before passing to the pipeline ---
        # This mirrors the initial cleaning done in train_disease_models.py
        # 1. Convert numerical columns to numeric, coercing errors
        # These lists should now use the lowercased names to match the input_df columns
        numerical_features_for_conversion = [
            'age', 'blood pressure', 'specific gravity', 'albumin', 'sugar',
            'blood glucose random', 'blood urea', 'serum creatinine', 'sodium',
            'potassium', 'hemoglobin', 'packed cell volume',
            'white blood cell count', 'red blood cell count'
        ]
        for col in numerical_features_for_conversion:
            if col in input_df.columns:
                input_df[col] = pd.to_numeric(input_df[col], errors='coerce')
            # If a numerical feature is missing or becomes NaN here, the SimpleImputer in the pipeline will handle it.

        # 2. Strip whitespace and lowercase categorical values
        # These lists should now use the lowercased names to match the input_df columns
        categorical_features_for_cleaning = [
            'pus cell', 'pus cell clumps', 'bacteria',
            'hypertension', 'diabetes mellitus', 'coronary artery disease',
            'appetite', 'pedal edema', 'anemia'
        ]
        for col in categorical_features_for_cleaning:
            if col in input_df.columns and input_df[col].dtype == 'object':
                input_df[col] = input_df[col].str.strip().str.lower()
            # If a categorical feature is missing, the SimpleImputer in the pipeline will handle it.

        # --- DEBUGGING: Check for any remaining NaNs in input_df before prediction ---
        print("\nDEBUG: Missing values in input_df before pipeline prediction:")
        print(input_df.isnull().sum()[input_df.isnull().sum() > 0])
        print("\nDEBUG: Input_df dtypes before pipeline prediction:")
        print(input_df.dtypes)

        # Now, pass the pre-processed DataFrame to the loaded pipeline for prediction
        prediction = ckd_model_pipeline.predict(input_df)[0]
        prediction_proba = ckd_model_pipeline.predict_proba(input_df)[0].tolist()

        # Map prediction to human-readable risk level and reason
        if prediction == 1:
            risk_level = 'High'
            reason = 'Based on the provided data, the model predicts a high risk of Chronic Kidney Disease. Immediate medical consultation is strongly advised for further evaluation and management.'
        else:
            risk_level = 'Low'
            reason = 'Based on the provided data, the model predicts a low risk of Chronic Kidney Disease. Continue to maintain a healthy lifestyle and regular check-ups. However, this is not a diagnosis.'

        return jsonify({
            'prediction': int(prediction), # Return as int
            'prediction_proba': prediction_proba,
            'risk_level': risk_level,
            'reason': reason
        })

    except KeyError as e:
        print(f"KeyError in CKD prediction: {e}")
        return jsonify({'error': f"Missing or incorrect key in input data: {e}. Please ensure all required fields are provided and match expected names."}), 400
    except ValueError as e:
        print(f"ValueError in CKD prediction: {e}")
        return jsonify({'error': f"Invalid data type or value in input: {e}. Please ensure all numerical fields contain valid numbers."}), 400
    except Exception as e:
        print(f"Unexpected error during CKD prediction: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Internal server error during prediction: {e}'}), 500
