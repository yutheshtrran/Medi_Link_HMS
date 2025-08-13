# tabular_routes/thyroid.py
from flask import Blueprint, request, jsonify
import pickle
import os

thyroid_bp = Blueprint('thyroid_bp', __name__)

# Define paths to your thyroid disease model
# Adjust 'saved-model' path as per your actual project structure
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..', '..'))
THYROID_MODEL_PATH = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model', 'thyroid_model.pkl') # Adjust model name

thyroid_model = None

# Load the thyroid disease model
try:
    if os.path.exists(THYROID_MODEL_PATH):
        with open(THYROID_MODEL_PATH, 'rb') as f:
            thyroid_model = pickle.load(f)
        print("✅ Thyroid Disease model loaded successfully.")
    else:
        print(f"⚠️ Warning: Thyroid Disease model not found at {THYROID_MODEL_PATH}")
except Exception as e:
    print(f"❌ Error loading Thyroid Disease model: {e}")

@thyroid_bp.route('/predict-thyroid-disease', methods=['POST'])
def predict_thyroid_disease():
    if thyroid_model is None:
        return jsonify({'error': 'Thyroid Disease model not loaded on server.'}), 500

    try:
        data = request.get_json(force=True)

        # Map frontend keys to model's expected features.
        # Ensure 'TSH_measured', 'T3_measured', etc., affect the actual TSH, T3 values.
        # For 'measured' fields, if value is 0 (No), use a default/placeholder like -1
        # or handle as missing data as your model expects.
        # Ensure boolean-like values are converted to 0/1 integers.
        features = [
            float(data['age']),
            int(data['sex']),
            int(data['on_thyroxine']),
            int(data['query_on_thyroxine']),
            int(data['on_antithyroid_meds']),
            int(data['sick']),
            int(data['pregnant']),
            int(data['thyroid_surgery']),
            int(data['I131_treatment']),
            int(data['query_hypothyroid']),
            int(data['query_hyperthyroid']),
            int(data['lithium']),
            int(data['goitre']),
            int(data['tumor']),
            int(data['hypopituitary']),
            int(data['psych']),
            int(data['TSH_measured']),
            float(data['TSH']), # Ensure this handles the -1 or placeholder if not measured
            int(data['T3_measured']),
            float(data['T3']),
            int(data['TT4_measured']),
            float(data['TT4']),
            int(data['T4U_measured']),
            float(data['T4U']),
            int(data['FTI_measured']),
            float(data['FTI']),
            int(data['TBG_measured']),
            float(data['TBG'])
            # ... add all 27 features here in the correct order for your model
        ]

        # Your model prediction logic goes here.
        # Example:
        # from numpy import array
        # features_array = array([features])
        # prediction = thyroid_model.predict(features_array)[0]

        # Dummy prediction for testing
        prediction = 0 # Assume 0 for healthy, 1 for hypothyroid, 2 for hyperthyroid etc.
        if float(data['TSH']) > 4.0 and int(data['TSH_measured']) == 1:
            prediction = 1 # Example: Hypothyroid if TSH is high

        return jsonify({'prediction': prediction, 'message': 'Thyroid prediction successful.'})

    except KeyError as e:
        return jsonify({'error': f'Missing data for key: {e}. Please ensure all required fields are sent.'}), 400
    except ValueError as e:
        return jsonify({'error': f'Invalid data type for input: {e}. Please ensure numbers are sent as numbers.'}), 400
    except Exception as e:
        print(f"Error during thyroid disease prediction: {e}")
        return jsonify({'error': f'Internal server error during thyroid prediction: {str(e)}'}), 500