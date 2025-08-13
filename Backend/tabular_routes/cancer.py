from flask import Blueprint, request, jsonify
import pickle
import pandas as pd
import numpy as np
import os
import sys
import traceback

# Adjust sys.path to import from backend.utils if needed
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..', '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

cancer_bp = Blueprint('cancer_bp', __name__)

# Load the model
MODEL_PATH = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model', 'cancer_model.pkl')
cancer_model = None
try:
    with open(MODEL_PATH, 'rb') as f:
        cancer_model = pickle.load(f)
    print(f"✅ Cancer model loaded from: {MODEL_PATH}")
except FileNotFoundError:
    print(f"⚠️ cancer_model.pkl not found at {MODEL_PATH}")
except Exception as e:
    print(f"❌ Error loading cancer model: {e}")
    traceback.print_exc()

# Expected features (exactly what model expects)
expected_features = [
    'age',
    'gender',
    'familyhistorycancer',
    'smokingstatus',
    'alcoholconsumption',
    'bmi',
    'physicalactivity_hoursperweek',
    'chronicdisease_hypertension',
    'chronicdisease_diabetes',
    'genomicmarker_1',
    'genomicmarker_2',
    'tumorsize_mm',
    'biopsyresult',
    'bloodtest_markera',
    'bloodtest_markerb',
    'symptoms_fatigue',
    'symptoms_unexplainedweightloss'
]

# Categorical mappings (keys lowercase for matching)
category_mappings = {
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

@cancer_bp.route('/predict-cancer', methods=['POST'])
def predict_cancer():
    print("--- Entered /predict-cancer route ---")
    try:
        data = request.get_json(force=True)
        print(f"📥 Received JSON data: {data}")

        if not data:
            return jsonify({
                "error": "No JSON data received.",
                "risk_level": "Error",
                "reason": "Empty input data."
            }), 400

        # Normalize keys to lowercase for consistent lookup
        data_lower = {k.lower(): v for k, v in data.items()}
        print("🧾 Normalized keys:", list(data_lower.keys()))

        input_features_list = []
        for feature in expected_features:
            if feature not in data_lower or data_lower[feature] is None or (isinstance(data_lower[feature], str) and not data_lower[feature].strip()):
                return jsonify({
                    "error": f"Missing or empty input for '{feature}'",
                    "risk_level": "Error",
                    "reason": f"Missing input: {feature}"
                }), 400

            val = data_lower[feature]

            # Map categories if needed
            if feature in category_mappings:
                mapped_val = category_mappings[feature].get(str(val).lower())
                if mapped_val is None:
                    return jsonify({
                        "error": f"Invalid value for '{feature}': '{val}'",
                        "risk_level": "Error",
                        "reason": f"Invalid categorical input: {feature}"
                    }), 400
                input_features_list.append(mapped_val)
            else:
                # Numeric conversion
                try:
                    input_features_list.append(float(val))
                except ValueError:
                    return jsonify({
                        "error": f"Invalid numeric value for '{feature}': '{val}'",
                        "risk_level": "Error",
                        "reason": f"Invalid numeric input: {feature}"
                    }), 400

        # Build DataFrame for model input
        input_df = pd.DataFrame([input_features_list], columns=expected_features)
        print(f"✅ Prepared input DataFrame:\n{input_df}")

        if cancer_model is None:
            return jsonify({
                "error": "Model not loaded.",
                "risk_level": "Error",
                "reason": "Model unavailable."
            }), 500

        # Predict
        if hasattr(cancer_model, 'predict_proba'):
            # Get the raw output from predict_proba
            raw_probabilities_output = cancer_model.predict_proba(input_df)
            
            # Debugging: Print the shape and content to confirm what it looks like
            # This will help you understand if your model always returns a 2D array, 1D array, or scalar
            print(f"📊 Raw predict_proba output: {raw_probabilities_output}, "
                  f"Shape: {raw_probabilities_output.shape if hasattr(raw_probabilities_output, 'shape') else 'N/A'}, "
                  f"Type: {type(raw_probabilities_output)}")

            # Determine prediction_score based on the shape of the probabilities output
            if isinstance(raw_probabilities_output, np.ndarray):
                if raw_probabilities_output.ndim == 2 and raw_probabilities_output.shape[1] == 2:
                    # Standard binary classifier output for a single sample: [[prob_class0, prob_class1]]
                    prediction_score = raw_probabilities_output[0][1] # Probability of positive cancer
                elif raw_probabilities_output.ndim == 1 and raw_probabilities_output.shape[0] == 1:
                    # Model might be returning only the positive class probability in a 1D array: [prob_pos]
                    prediction_score = raw_probabilities_output[0]
                elif raw_probabilities_output.ndim == 0:
                    # Model might be returning a scalar directly (e.g., from a regressor or custom binary output)
                    prediction_score = raw_probabilities_output.item()
                else:
                    # Fallback for unexpected array shapes
                    print("Warning: predict_proba returned an unexpected array shape. Attempting to extract single value.")
                    try:
                        prediction_score = float(raw_probabilities_output.flatten()[0])
                    except Exception as e:
                        print(f"Error flattening and extracting from unexpected array: {e}")
                        raise ValueError("Model predict_proba output in an unrecognized array format.")
            elif isinstance(raw_probabilities_output, (float, int)):
                # If predict_proba directly returns a scalar
                prediction_score = float(raw_probabilities_output)
            else:
                # If the output type is entirely unexpected
                print("Warning: predict_proba returned an unexpected non-array/non-scalar type. Attempting direct conversion.")
                try:
                    prediction_score = float(raw_probabilities_output)
                except Exception as e:
                    print(f"Error converting unexpected predict_proba output: {e}")
                    raise ValueError("Model predict_proba output in an unrecognized format.")

            print(f"📊 Final prediction score (after extraction): {prediction_score}")
        else:
            # If the model does not have predict_proba, use predict
            prediction = cancer_model.predict(input_df)[0]
            prediction_score = float(prediction) # Ensure it's a float for consistent handling below
            print(f"📊 Raw prediction (no predict_proba): {prediction_score}")

        # Risk level mapping
        # Ensure prediction_score is always treated as a float for these comparisons
        if prediction_score < 0.35:
            risk_level = 'Low'
            reason = 'Low predicted risk. Maintain a healthy lifestyle.'
        elif prediction_score < 0.65:
            risk_level = 'Medium'
            reason = 'Moderate predicted risk. Consider consulting a doctor.'
        else:
            risk_level = 'High'
            reason = 'High predicted risk. Immediate medical attention recommended.'

        final_response = {
            "risk_level": risk_level,
            "reason": reason
        }
        print(f"✅ Final response: {final_response}")
        return jsonify(final_response), 200

    except Exception as e:
        print(f"❌ Exception in /predict-cancer: {e}")
        traceback.print_exc()
        return jsonify({
            "error": str(e),
            "risk_level": "Error",
            "reason": "Unexpected server error."
        }), 500
