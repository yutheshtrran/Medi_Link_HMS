import pickle
import os
import json
import numpy as np
import logging
import traceback
import pandas as pd

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SAVED_MODELS_DIR = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model')

loaded_models = {}

MODEL_CONFIG = {
    'diabetes': 'diabetes_model.pkl',
    'heartDisease': 'heart_disease_model.pkl',
    'hypertension': 'hypertension_model.pkl',
    'ckd': 'ckd_model.pkl',
    'liverDisease': 'liver_disease_model.pkl',
    'thyroidDisease': 'thyroid_model.pkl', 
    'cancerDisease': 'cancer_model.pkl', 
}

for disease_id, model_filename in MODEL_CONFIG.items():
    model_path = os.path.join(SAVED_MODELS_DIR, model_filename)
    try:
        if os.path.exists(model_path):
            with open(model_path, 'rb') as f:
                loaded_models[disease_id] = pickle.load(f)
            logging.info(f"✅ {disease_id} model loaded successfully from {model_path}.")
        else:
            logging.warning(f"⚠️ Warning: {disease_id} model not found at {model_path}. Prediction for this disease will not work via report upload.")
    except Exception as e:
        logging.error(f"❌ Error loading {disease_id} model from {model_path}: {e}", exc_info=True)


MODEL_FEATURE_NAMES = {
    'cancerDisease': [
        "age", "gender", "smokingstatus", "alcoholconsumption", "bmi", 
        "physicalactivity_hoursperweek", "familyhistorycancer", 
        "chronicdisease_hypertension", "chronicdisease_diabetes", 
        "genomicmarker_1", "genomicmarker_2", "tumorsize_mm", 
        "tumormarkerlevel", "biopsyresult", "bloodtest_markera", 
        "bloodtest_markerb", "symptoms_fatigue", "symptoms_unexplainedweightloss"
    ],
    # Add other disease_id: feature_name_list mappings if they also expect DataFrames
    # 'diabetes': ["pregnancies", "glucose", "blood_pressure", "skin_thickness", "insulin", "bmi", "diabetes_pedigree_function", "age"],
}


def predict_from_text(structured_data_dict, disease_id):
    logging.info(f"predict_from_text: Received disease_id='{disease_id}'")
    if disease_id not in loaded_models or loaded_models[disease_id] is None:
        logging.error(f"predict_from_text: Model for {disease_id} not loaded or found.")
        return {
            'risk_level': 'Error',
            'reason': f'ML model for {disease_id} is not loaded on the server. Please check backend logs for model loading errors.'
        }

    try:
        structured_data = structured_data_dict 

        logging.info(f"predict_from_text: Structured data received for {disease_id}: {structured_data}")
        
        features = convert_to_features(structured_data, disease_id)
        
        if features is None:
            logging.error(f"predict_from_text: Features could not be generated for {disease_id}. Check convert_to_features logic and Gemini output.")
            return {
                'risk_level': 'Error',
                'reason': f'Could not extract relevant features for {disease_id} from the report data. Please ensure the report contains the necessary information.'
            }
        
        if disease_id in MODEL_FEATURE_NAMES:
            feature_names = MODEL_FEATURE_NAMES[disease_id]
            if len(features) != len(feature_names):
                logging.error(f"Feature count mismatch for {disease_id}: Generated {len(features)}, Expected {len(feature_names)}")
                return {
                    'risk_level': 'Error',
                    'reason': f'Internal error: Feature count mismatch for {disease_id}. Check model_utils.py feature definitions.'
                }
            features_df = pd.DataFrame([features], columns=feature_names)
            logging.info(f"predict_from_text: Features DataFrame for prediction:\n{features_df}")
            features_for_prediction = features_df
        else:
            features_array = np.array([features])
            logging.info(f"predict_from_text: Features array for prediction: {features_array}")
            features_for_prediction = features_array

        model = loaded_models[disease_id]
        prediction_outcome = None 
        
        if hasattr(model, 'predict_proba') and disease_id != 'thyroidDisease':
            raw_proba_output = model.predict_proba(features_for_prediction)
            
            logging.debug(f"DEBUG: Raw predict_proba output for {disease_id}: {raw_proba_output}")

            if raw_proba_output.ndim == 2 and raw_proba_output.shape[1] == 2:
                # Standard binary classification output: [[prob_class_0, prob_class_1]]
                probabilities = raw_proba_output[0] # Get the probabilities for the first sample
                prediction_outcome = probabilities[1] # Probability of the positive class (class 1)
            elif raw_proba_output.ndim == 1 and raw_proba_output.shape[0] == 1:
                # Less common: if predict_proba returns [prob_positive_class] directly
                prediction_outcome = raw_proba_output[0]
                logging.warning(f"predict_proba returned a single-element array for {disease_id}. Assuming it's the probability of the positive class.")
            elif isinstance(raw_proba_output, (float, np.floating)):
                 # If it returns a single scalar value directly
                 prediction_outcome = raw_proba_output
                 logging.warning(f"predict_proba returned a scalar for {disease_id}. Assuming it's the probability of the positive class.")
            else:
                # Fallback or error if the output format is truly unexpected
                logging.error(f"Unexpected predict_proba output format for {disease_id}: {raw_proba_output}. Cannot determine prediction outcome.")
                return {
                    'risk_level': 'Error',
                    'reason': f'ML model output format unexpected for {disease_id}. Could not interpret probabilities.'
                }

            logging.info(f"predict_from_text: Probability of positive outcome (class 1): {prediction_outcome}")
        else:
            # For multi-class models (like Thyroid) or models without predict_proba
            prediction_outcome = model.predict(features_for_prediction)[0] 
            logging.info(f"predict_from_text: Raw prediction outcome for {disease_id}: {prediction_outcome}")


        risk_level, reason = map_prediction_to_risk_and_reason(prediction_outcome, disease_id)
        
        final_prediction_result = {
            'risk_level': risk_level,
            'reason': reason
        }
        logging.info(f"predict_from_text: Final prediction result: {final_prediction_result}")
        return final_prediction_result

    except Exception as e:
        logging.error(f"predict_from_text: Error during prediction for {disease_id}: {e}", exc_info=True)
        return {
            'risk_level': 'Error',
            'reason': f'Prediction failed due to an internal ML error: {e}. Check model_utils.py for feature conversion or model issues. Full error logged.'
        }

# (Keep safe_float, convert_to_features, and map_prediction_to_risk_and_reason functions as they were in the previous corrected code)

# Helper function (keep as is)
def safe_float(value, default=0.0):
    try:
        if value is None:
            return default
        return float(value)
    except (ValueError, TypeError):
        logging.warning(f"Could not convert value '{value}' to float, using default '{default}'")
        return default

def convert_to_features(structured_data, disease_id):
    """
    Converts structured data (dict) into a numerical feature vector
    for the specific ML model. This is disease-specific.
    Ensures that missing keys default to 0 or -1, and types are correct.
    """
    features = []
    logging.info(f"convert_to_features: Processing for {disease_id} with data: {structured_data}")

    # --- Diabetes Features ---
    if disease_id == 'diabetes':
        features = [
            safe_float(structured_data.get("pregnancies", 0)),
            safe_float(structured_data.get("glucose", 0)),
            safe_float(structured_data.get("blood_pressure", 0)),
            safe_float(structured_data.get("skin_thickness", 0)),
            safe_float(structured_data.get("insulin", 0)),
            safe_float(structured_data.get("bmi", 0)),
            safe_float(structured_data.get("diabetes_pedigree_function", 0)),
            safe_float(structured_data.get("age", 0)),
        ]

    # --- Heart Disease Features ---
    elif disease_id == 'heartDisease':
        features = [
            safe_float(structured_data.get("age", 0)),
            safe_float(structured_data.get("sex", 0)), # 0 for male, 1 for female
            safe_float(structured_data.get("chest_pain_type", 0)),
            safe_float(structured_data.get("trestbps", 0)),
            safe_float(structured_data.get("cholesterol", 0)),
            safe_float(structured_data.get("fbs", 0)),
            safe_float(structured_data.get("restecg", 0)),
            safe_float(structured_data.get("thalach", 0)),
            safe_float(structured_data.get("exang", 0)),
            safe_float(structured_data.get("oldpeak", 0)),
            safe_float(structured_data.get("slope", 0)),
            safe_float(structured_data.get("ca", 0)),
            safe_float(structured_data.get("thal", 0)),
        ]

    # --- Hypertension Features ---
    elif disease_id == 'hypertension':
        features = [
            safe_float(structured_data.get("Age_yrs", 0)),
            safe_float(structured_data.get("Gender", 0)),
            safe_float(structured_data.get("Education_Level", 0)),
            safe_float(structured_data.get("Occupation", 0)),
            safe_float(structured_data.get("Physical_Activity", 0)),
            safe_float(structured_data.get("Smoking_Habits", 0)),
            safe_float(structured_data.get("BMI", 0)),
        ]

    # --- CKD Features ---
    elif disease_id == 'ckd':
        features = [
            safe_float(structured_data.get("age", 0)),
            safe_float(structured_data.get("blood_pressure", 0)),
            safe_float(structured_data.get("specific_gravity", 0)),
            safe_float(structured_data.get("albumin", 0)),
            safe_float(structured_data.get("sugar", 0)),
            safe_float(structured_data.get("blood_glucose_random", 0)),
            safe_float(structured_data.get("blood_urea", 0)),
            safe_float(structured_data.get("serum_creatinine", 0)),
            safe_float(structured_data.get("sodium", 0)),
            safe_float(structured_data.get("potassium", 0)),
            safe_float(structured_data.get("hemoglobin", 0)),
            safe_float(structured_data.get("packed_cell_volume", 0)),
            safe_float(structured_data.get("white_blood_cell_count", 0)),
            safe_float(structured_data.get("red_blood_cell_count", 0)),
            safe_float(1 if structured_data.get("pus_cell", "normal").lower() == "abnormal" else 0),
            safe_float(1 if structured_data.get("pus_cell_clumps", "notpresent").lower() == "present" else 0),
            safe_float(1 if structured_data.get("bacteria", "notpresent").lower() == "present" else 0),
            safe_float(1 if structured_data.get("hypertension", "no").lower() == "yes" else 0),
            safe_float(1 if structured_data.get("diabetes_mellitus", "no").lower() == "yes" else 0),
            safe_float(1 if structured_data.get("coronary_artery_disease", "no").lower() == "yes" else 0),
            safe_float(1 if structured_data.get("appetite", "good").lower() == "poor" else 0),
            safe_float(1 if structured_data.get("pedal_edema", "no").lower() == "yes" else 0),
            safe_float(1 if structured_data.get("anemia", "no").lower() == "yes" else 0),
        ]

    # --- Liver Disease Features ---
    elif disease_id == 'liverDisease':
        features = [
            safe_float(structured_data.get("Age", 0)),
            safe_float(structured_data.get("Gender", 0)), # 0 for Male, 1 for Female
            safe_float(structured_data.get("Total_Bilirubin", 0)),
            safe_float(structured_data.get("Direct_Bilirubin", 0)),
            safe_float(structured_data.get("Alkaline_Phosphotase", 0)),
            safe_float(structured_data.get("Alamine_Aminotransferase", 0)),
            safe_float(structured_data.get("Aspartate_Aminotransferase", 0)),
            safe_float(structured_data.get("Total_Protiens", 0)),
            safe_float(structured_data.get("Albumin", 0)),
            safe_float(structured_data.get("Albumin_and_Globulin_Ratio", 0)),
        ]

    # --- Thyroid Disease Features ---
    elif disease_id == 'thyroidDisease':
        features = [
            safe_float(structured_data.get("age", 0)),
            safe_float(structured_data.get("sex", 0)),
            safe_float(structured_data.get("on_thyroxine", 0)),
            safe_float(structured_data.get("query_on_thyroxine", 0)),
            safe_float(structured_data.get("on_antithyroid_meds", 0)),
            safe_float(structured_data.get("sick", 0)),
            safe_float(structured_data.get("pregnant", 0)),
            safe_float(structured_data.get("thyroid_surgery", 0)),
            safe_float(structured_data.get("I131_treatment", 0)),
            safe_float(structured_data.get("query_hypothyroid", 0)),
            safe_float(structured_data.get("query_hyperthyroid", 0)),
            safe_float(structured_data.get("lithium", 0)),
            safe_float(structured_data.get("goitre", 0)),
            safe_float(structured_data.get("tumor", 0)),
            safe_float(structured_data.get("hypopituitary", 0)),
            safe_float(structured_data.get("psych", 0)),
            safe_float(structured_data.get("TSH_measured", 0)),
            safe_float(structured_data.get("TSH", -1)), 
            safe_float(structured_data.get("T3_measured", 0)),
            safe_float(structured_data.get("T3", -1)),
            safe_float(structured_data.get("TT4_measured", 0)),
            safe_float(structured_data.get("TT4", -1)),
            safe_float(structured_data.get("T4U_measured", 0)),
            safe_float(structured_data.get("T4U", -1)),
            safe_float(structured_data.get("FTI_measured", 0)),
            safe_float(structured_data.get("FTI", -1)),
            safe_float(structured_data.get("TBG_measured", 0)),
            safe_float(structured_data.get("TBG", -1)),
        ]

    # --- Cancer Disease Features (CRITICAL: MUST MATCH TRAINED MODEL EXACTLY) ---
    elif disease_id == 'cancerDisease':
        # Map categorical features to numerical values
        gender_map = {"Male": 0, "Female": 1} 
        smoking_map = {"Never": 0, "Former": 1, "Current": 2, "Never Smoked": 0, "Former Smoker": 1, "Current Smoker": 2} 
        biopsy_map = {"Benign": 0, "Malignant": 1, "Not Performed": 2, "Atypical": 3} 
        
        # **ASSUMED FEATURE ORDER AND NAMES FOR 18 FEATURES.**
        # This list MUST EXACTLY match the feature order your cancer_model.pkl was trained on.
        features = [
            safe_float(structured_data.get("age", 0)), 
            safe_float(gender_map.get(structured_data.get("gender", "Male"), 0)), 
            safe_float(smoking_map.get(structured_data.get("smokingstatus", "Never Smoked"), 0)), 
            safe_float(structured_data.get("alcoholconsumption", 0)), 
            safe_float(structured_data.get("bmi", 0)), 
            safe_float(structured_data.get("physicalactivity_hoursperweek", 0)), 
            safe_float(structured_data.get("familyhistorycancer", "0")), 
            safe_float(structured_data.get("chronicdisease_hypertension", "0")), 
            safe_float(structured_data.get("chronicdisease_diabetes", "0")), 
            safe_float(structured_data.get("genomicmarker_1", 0)), 
            safe_float(structured_data.get("genomicmarker_2", 0)), 
            safe_float(structured_data.get("tumorsize_mm", 0)), 
            safe_float(structured_data.get("tumormarkerlevel", 0)), 
            safe_float(biopsy_map.get(structured_data.get("biopsyresult", "Benign"), 0)), 
            safe_float(structured_data.get("bloodtest_markera", 0.0)), 
            safe_float(structured_data.get("bloodtest_markerb", 0.0)), 
            safe_float(structured_data.get("symptoms_fatigue", "0")), 
            safe_float(structured_data.get("symptoms_unexplainedweightloss", "0")), 
        ]

    else:
        logging.warning(f"convert_to_features: No feature conversion logic for disease_id: {disease_id}")
        return None 

    logging.info(f"convert_to_features: Generated features: {features} (Count: {len(features)})")
    return features


def map_prediction_to_risk_and_reason(prediction_outcome, disease_id):
    logging.info(f"map_prediction_to_risk_and_reason: Mapping outcome {prediction_outcome} for {disease_id}")
    risk_level = 'Cannot Determine'
    reason = 'The model returned an unexpected prediction outcome or the mapping is incomplete.'

    if disease_id in ['diabetes', 'heartDisease', 'hypertension', 'ckd', 'liverDisease', 'cancerDisease']: 
        if isinstance(prediction_outcome, (float, np.floating)) and 0.0 <= prediction_outcome <= 1.0:
            probability_positive = prediction_outcome 

            if probability_positive < 0.35: 
                risk_level = 'Low'
                reason = 'Based on the analysis, the likelihood of this condition is currently low. Continue to maintain a healthy lifestyle and regular check-ups.'
            elif probability_positive < 0.65: 
                risk_level = 'Medium'
                reason = 'Based on the analysis, there is a moderate likelihood of this condition. It is recommended to consult a healthcare professional for further evaluation and personalized advice.'
            else: 
                risk_level = 'High'
                reason = 'Based on the analysis, there is a significant predicted likelihood of this condition. It is strongly recommended to consult a healthcare professional immediately for a comprehensive assessment and advice.'
        else: 
            if prediction_outcome == 0:
                risk_level = 'Low'
                reason = 'Based on the analysis, the likelihood of this condition is currently low. Continue to maintain a healthy lifestyle and regular check-ups.'
            elif prediction_outcome == 1:
                risk_level = 'High'
                reason = 'Based on the analysis, there is a significant predicted likelihood of this condition. It is strongly recommended to consult a healthcare professional immediately for a comprehensive assessment and advice.'
            else:
                risk_level = 'Cannot Determine'
                reason = 'The model returned an unexpected prediction value. Further evaluation is needed.'

    elif disease_id == 'thyroidDisease':
        if prediction_outcome == 0:
            risk_level = 'Low'
            reason = 'Based on the report analysis, no thyroid disease is currently detected. Continue to maintain a healthy lifestyle and regular check-ups.'
        elif prediction_outcome == 1:
            risk_level = 'High'
            reason = 'Based on the report analysis, there is a predicted risk of Hypothyroid. It is strongly recommended to consult a healthcare professional immediately for a comprehensive assessment and advice.'
        elif prediction_outcome == 2:
            risk_level = 'High'
            reason = 'Based on the report analysis, there is a predicted risk of Hyperthyroid. It is strongly recommended to consult a healthcare professional immediately for a comprehensive assessment and advice.'
        else:
            risk_level = 'Medium' 
            reason = 'Based on the report analysis, an indeterminate thyroid condition was detected. Further medical evaluation is advised.'

    logging.info(f"map_prediction_to_risk_and_reason: Determined risk_level='{risk_level}', reason='{reason}'")
    return risk_level, reason