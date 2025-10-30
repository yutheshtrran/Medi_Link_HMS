# tabular_routes/liver_disease.py
from flask import Blueprint, request, jsonify
import pickle
import os

liver_bp = Blueprint('liver_bp', __name__)

# Define paths to your liver disease model (adjust as per your actual structure)
# Assuming the model is in ml_model/saved-model/liver_disease_model.pkl
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..', '..')) # Adjust path to project root
LIVER_MODEL_PATH = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model', 'liver_disease_model.pkl')

liver_model = None

# Load the liver disease model
try:
    if os.path.exists(LIVER_MODEL_PATH):
        with open(LIVER_MODEL_PATH, 'rb') as f:
            liver_model = pickle.load(f)
        print("✅ Liver Disease model loaded successfully.")
    else:
        print(f"⚠️ Warning: Liver Disease model not found at {LIVER_MODEL_PATH}")
except Exception as e:
    print(f"❌ Error loading Liver Disease model: {e}")

@liver_bp.route('/predict-liver-disease', methods=['POST'])
def predict_liver_disease():
    if liver_model is None:
        return jsonify({'error': 'Liver Disease model not loaded.'}), 500

    try:
        data = request.get_json(force=True)
        # Ensure these keys match exactly what your frontend sends
        # and what your model expects
        features = [
            data['Age'],
            data['Gender'], # Assuming 0 for Male, 1 for Female
            data['Total_Bilirubin'],
            data['Direct_Bilirubin'],
            data['Alkaline_Phosphotase'],
            data['Alamine_Aminotransferase'],
            data['Aspartate_Aminotransferase'],
            data['Total_Protiens'],
            data['Albumin'],
            data['Albumin_and_Globulin_Ratio']
        ]

        # Convert features to a format expected by your model (e.g., numpy array if it's a scikit-learn model)
        # Example: from numpy import array; features_array = array([features])
        # For demonstration, we'll just use a dummy prediction
        # prediction = liver_model.predict([features])[0] # Uncomment and adapt for your actual model

        # Dummy prediction for testing if the model isn't loaded or for placeholder
        prediction = 0 # Default to no liver disease
        if data['Total_Bilirubin'] > 1.2 or data['Alamine_Aminotransferase'] > 40: # Example condition
            prediction = 1

        return jsonify({'prediction': prediction, 'message': 'Prediction successful.'})

    except KeyError as e:
        return jsonify({'error': f'Missing data for key: {e}. Please ensure all required fields are sent.'}), 400
    except Exception as e:
        print(f"Error during liver disease prediction: {e}")
        return jsonify({'error': f'Internal server error during prediction: {str(e)}'}), 500