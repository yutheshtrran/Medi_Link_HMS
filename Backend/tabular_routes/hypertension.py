import os
import pickle
import traceback
from flask import Blueprint, request, jsonify
import pandas as pd

# ----------------------------- #
# 🔷 Hypertension Flask Blueprint
# ----------------------------- #

# Create a Blueprint
hypertension_bp = Blueprint('hypertension_bp', __name__)

# Dynamically determine project root
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # Current file dir: D:\Medi_Link\Backend\tabular_routes
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..', '..'))  # D:\Medi_Link

# Set model and preprocessor paths
HYPERTENSION_TABULAR_MODEL_PATH = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model', 'hypertension_model.pkl')
HYPERTENSION_PREPROCESSOR_PATH = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model', 'hypertension_preprocessor.pkl')

# Initialize model and preprocessor
hypertension_tabular_model = None
hypertension_preprocessor = None

# ----------------------------- #
# 🔄 Load Model and Preprocessor
# ----------------------------- #
try:
    if os.path.exists(HYPERTENSION_TABULAR_MODEL_PATH):
        with open(HYPERTENSION_TABULAR_MODEL_PATH, 'rb') as f:
            hypertension_tabular_model = pickle.load(f)
        print("✅ Hypertension tabular model loaded successfully.")
    else:
        print(f"⚠️ Model file NOT FOUND at: {HYPERTENSION_TABULAR_MODEL_PATH}")

    if os.path.exists(HYPERTENSION_PREPROCESSOR_PATH):
        with open(HYPERTENSION_PREPROCESSOR_PATH, 'rb') as f:
            hypertension_preprocessor = pickle.load(f)
        print("✅ Hypertension preprocessor loaded successfully.")
    else:
        print(f"⚠️ Preprocessor file NOT FOUND at: {HYPERTENSION_PREPROCESSOR_PATH}")

except Exception as e:
    print(f"❌ ERROR loading model/preprocessor: {e}")
    traceback.print_exc() # Print full traceback for loading errors
    hypertension_tabular_model = None
    hypertension_preprocessor = None

# ----------------------------- #
# 📦 Prediction Route
# ----------------------------- #
@hypertension_bp.route('/predict-hypertension', methods=['POST'])
def predict_hypertension():
    form_data = request.json
    print(f"📥 Incoming data: {form_data}")

    if not hypertension_tabular_model or not hypertension_preprocessor:
        return jsonify({"error": "Hypertension model or preprocessor not loaded on the server. Check server logs."}), 500

    expected_input_keys = [
        'Age_yrs', 'Gender', 'Education_Level', 'Occupation',
        'Physical_Activity', 'Smoking_Habits', 'BMI'
    ]

    input_values_dict = {}
    for key in expected_input_keys:
        val = form_data.get(key)
        if val is None:
            return jsonify({"error": f"Missing value for '{key}'"}), 400
        input_values_dict[key] = val

    input_df = pd.DataFrame([input_values_dict])
    print(f"📊 Input DataFrame before type conversion:\n{input_df}")
    print(f"📊 Initial dtypes:\n{input_df.dtypes}")

    try:
        # --- FIX START ---
        # Explicitly cast categorical columns to string type
        # This is crucial if your preprocessor (e.g., OneHotEncoder) expects object/string dtypes
        categorical_cols = ['Gender', 'Education_Level', 'Occupation', 'Physical_Activity', 'Smoking_Habits']
        for col in categorical_cols:
            if col in input_df.columns:
                input_df[col] = input_df[col].astype(str) # Convert integer categories to strings

        # Ensure numerical columns are correctly typed as numbers (float is generally safe)
        numerical_cols = ['Age_yrs', 'BMI']
        for col in numerical_cols:
            if col in input_df.columns:
                # Use pd.to_numeric with errors='coerce' to handle potential non-numeric inputs gracefully
                # (though frontend should prevent most of these)
                input_df[col] = pd.to_numeric(input_df[col], errors='coerce')
                # If any NaN resulted from coercion, you might need to handle them here
                if input_df[col].isnull().any():
                    print(f"WARNING: NaN found in numerical column '{col}' after conversion. Check input data.")
                    # Depending on your model, you might need to impute these NaNs, e.g., input_df[col].fillna(0, inplace=True)

        print(f"📊 Input DataFrame after type conversion:\n{input_df}")
        print(f"📊 Final dtypes before preprocessing:\n{input_df.dtypes}")
        # --- FIX END ---

        processed_input = hypertension_preprocessor.transform(input_df)
        print("✅ Preprocessing successful.")
        print(f"🧪 Processed input (first 5 rows):\n{processed_input[:5]}") # Print only first few rows for large arrays

    except Exception as e:
        print(f"❌ Preprocessing error: {e}")
        traceback.print_exc() # Print full Python traceback to Flask console
        return jsonify({"error": f"Preprocessing failed: {e}. Check server logs for details."}), 500

    try:
        prediction = hypertension_tabular_model.predict(processed_input)[0]
        print(f"✨ Prediction successful: {prediction}")
        return jsonify({"prediction": int(prediction)})

    except Exception as e:
        print(f"❌ Prediction error: {e}")
        traceback.print_exc() # Print full Python traceback to Flask console
        return jsonify({"error": f"Prediction failed: {e}. Check server logs for details."}), 500

