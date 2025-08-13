import os
import json
import google.generativeai as genai
import numpy as np # Import numpy for potential NaN or inf handling in mock response

# --- IMPORTANT: Configure your Gemini API Key ---
# It's highly recommended to set this as an environment variable:
# For Linux/macOS: export GEMINI_API_KEY="YOUR_API_KEY_HERE"
# For Windows (Command Prompt): set GEMINI_API_KEY="YOUR_API_KEY_HERE"
# For Windows (PowerShell): $env:GEMINI_API_KEY="YOUR_API_KEY_HERE"
# Or you can set it directly here for testing, but AVOID in production:
# os.environ["GEMINI_API_KEY"] = "YOUR_API_KEY_HERE" # <-- Replace with actual key or rely on env var

def call_gemini_api(extracted_text, disease_id):
    """
    Calls the Gemini API to extract structured information from raw text
    based on the disease_id.
    
    Instructs Gemini to return a JSON object with relevant medical parameters.
    
    Returns a Python dictionary containing the structured data.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ Gemini API key is not set in environment variables. Using mock response.")
        # Fallback to mock if API key is not found
        return _get_mock_gemini_response(extracted_text, disease_id)

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash') # Using a faster model for text generation

        # Define the expected schema for Gemini's output based on disease_id
        # This is a critical part: the schema MUST match what your ML models expect
        # in model_utils.py's convert_to_features function.
        response_schema = _get_gemini_response_schema(disease_id)
        if not response_schema:
            print(f"Warning: No specific schema defined for disease_id '{disease_id}'. Using generic prompt.")
            # Fallback to generic prompt if no specific schema
            prompt_text = f"""
            You are a medical report analysis assistant. From the following medical report text,
            extract the relevant numerical and categorical parameters for {disease_id} and
            return them as a JSON object. If a parameter is not explicitly found, use a
            sensible default (e.g., 0, -1, or null, depending on the parameter).

            **Report Text:**
            \"\"\"{extracted_text}\"\"\"

            Please provide ONLY the JSON object.
            """
            generation_config = {
                "response_mime_type": "application/json",
            }
        else:
            prompt_text = f"""
            You are a medical report analysis assistant. From the following medical report text,
            extract the relevant numerical and categorical parameters for {disease_id} and
            return them as a JSON object. Ensure the output strictly adheres to the provided JSON schema.
            If a parameter is not explicitly found or is not applicable, use a sensible default (e.g., null, 0, or -1, depending on the parameter type).
            For categorical fields, ensure the value is one of the allowed enum values.

            **Report Text:**
            \"\"\"{extracted_text}\"\"\"
            """
            generation_config = {
                "response_mime_type": "application/json",
                "response_schema": response_schema
            }

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt_text}
                    ]
                }
            ],
            "generationConfig": generation_config
        }

        # Make the API call
        response = model.generate_content(payload["contents"], generation_config=payload["generationConfig"])
        
        # Extract the text part of the response, which should be a JSON string
        gemini_raw_text = response.text
        print(f"Gemini Raw Response Text: {gemini_raw_text}")

        # Parse the JSON string into a Python dictionary
        structured_data_dict = json.loads(gemini_raw_text)
        print(f"Gemini Parsed Structured Data: {structured_data_dict}")
        return structured_data_dict

    except json.JSONDecodeError as e:
        print(f"❌ Gemini API returned invalid JSON: {gemini_raw_text} - Error: {e}")
        # Fallback to mock or return an error structure
        return {
            "disease": disease_id,
            "error": "Gemini returned invalid JSON. Check Gemini's output format.",
            "risk_level": "Error",
            "reason": "AI analysis failed due to malformed data from Gemini. Please try again or provide a clearer report."
        }
    except Exception as e:
        print(f"❌ Exception calling Gemini API: {str(e)}", exc_info=True)
        # Fallback to mock or return an error structure
        return {
            "disease": disease_id,
            "error": f"Gemini API call failed: {str(e)}",
            "risk_level": "Error",
            "reason": "AI analysis failed due to an issue with the Gemini API. Please check your API key and network."
        }


def _get_gemini_response_schema(disease_id):
    """
    Returns a JSON schema for Gemini's response based on the disease_id.
    This helps guide Gemini to return structured data.
    IMPORTANT: Align these schemas with the features expected by your ML models
    in backend/utils/model_utils.py -> convert_to_features.
    """
    schema = {
        "type": "OBJECT",
        "properties": {
            "disease": {"type": "STRING"},
        },
        "required": ["disease"]
    }

    if disease_id == 'diabetes':
        schema["properties"].update({
            "pregnancies": {"type": "NUMBER"},
            "glucose": {"type": "NUMBER"},
            "blood_pressure": {"type": "NUMBER"},
            "skin_thickness": {"type": "NUMBER"},
            "insulin": {"type": "NUMBER"},
            "bmi": {"type": "NUMBER"},
            "diabetes_pedigree_function": {"type": "NUMBER"},
            "age": {"type": "NUMBER"},
            "gender": {"type": "STRING", "enum": ["male", "female", "other", "unknown"]},
        })
        schema["propertyOrdering"] = ["disease", "age", "gender", "pregnancies", "glucose", "blood_pressure", "skin_thickness", "insulin", "bmi", "diabetes_pedigree_function"]
    elif disease_id == 'heartDisease':
        schema["properties"].update({
            "age": {"type": "NUMBER"},
            "sex": {"type": "NUMBER", "enum": [0, 1]}, # 0: male, 1: female
            "chest_pain_type": {"type": "NUMBER", "enum": [0, 1, 2, 3]},
            "trestbps": {"type": "NUMBER"},
            "cholesterol": {"type": "NUMBER"},
            "fbs": {"type": "NUMBER", "enum": [0, 1]},
            "restecg": {"type": "NUMBER", "enum": [0, 1, 2]},
            "thalach": {"type": "NUMBER"},
            "exang": {"type": "NUMBER", "enum": [0, 1]},
            "oldpeak": {"type": "NUMBER"},
            "slope": {"type": "NUMBER", "enum": [0, 1, 2]},
            "ca": {"type": "NUMBER", "enum": [0, 1, 2, 3]},
            "thal": {"type": "NUMBER", "enum": [1, 2, 3]},
        })
        schema["propertyOrdering"] = ["disease", "age", "sex", "chest_pain_type", "trestbps", "cholesterol", "fbs", "restecg", "thalach", "exang", "oldpeak", "slope", "ca", "thal"]
    elif disease_id == 'hypertension':
        schema["properties"].update({
            "Age_yrs": {"type": "NUMBER"},
            "Gender": {"type": "NUMBER", "enum": [0, 1]},
            "Education_Level": {"type": "NUMBER", "enum": [0, 1, 2, 3]},
            "Occupation": {"type": "NUMBER", "enum": [0, 1, 2, 3, 4]},
            "Physical_Activity": {"type": "NUMBER", "enum": [0, 1, 2]},
            "Smoking_Habits": {"type": "NUMBER", "enum": [0, 1, 2]},
            "BMI": {"type": "NUMBER"},
        })
        schema["propertyOrdering"] = ["disease", "Age_yrs", "Gender", "Education_Level", "Occupation", "Physical_Activity", "Smoking_Habits", "BMI"]
    elif disease_id == 'ckd':
        schema["properties"].update({
            "age": {"type": "NUMBER"},
            "blood_pressure": {"type": "NUMBER"},
            "specific_gravity": {"type": "NUMBER"},
            "albumin": {"type": "NUMBER", "enum": [0, 1, 2, 3, 4, 5]},
            "sugar": {"type": "NUMBER", "enum": [0, 1, 2, 3, 4, 5]},
            "blood_glucose_random": {"type": "NUMBER"},
            "blood_urea": {"type": "NUMBER"},
            "serum_creatinine": {"type": "NUMBER"},
            "sodium": {"type": "NUMBER"},
            "potassium": {"type": "NUMBER"},
            "hemoglobin": {"type": "NUMBER"},
            "packed_cell_volume": {"type": "NUMBER"},
            "white_blood_cell_count": {"type": "NUMBER"},
            "red_blood_cell_count": {"type": "NUMBER"},
            "pus_cell": {"type": "STRING", "enum": ["normal", "abnormal"]},
            "pus_cell_clumps": {"type": "STRING", "enum": ["notpresent", "present"]},
            "bacteria": {"type": "STRING", "enum": ["notpresent", "present"]},
            "hypertension": {"type": "STRING", "enum": ["yes", "no"]},
            "diabetes_mellitus": {"type": "STRING", "enum": ["yes", "no"]},
            "coronary_artery_disease": {"type": "STRING", "enum": ["yes", "no"]},
            "appetite": {"type": "STRING", "enum": ["good", "poor"]},
            "pedal_edema": {"type": "STRING", "enum": ["yes", "no"]},
            "anemia": {"type": "STRING", "enum": ["yes", "no"]},
        })
    elif disease_id == 'liverDisease':
        schema["properties"].update({
            "Age": {"type": "NUMBER"},
            "Gender": {"type": "NUMBER", "enum": [0, 1]}, # 0 for Male, 1 for Female
            "Total_Bilirubin": {"type": "NUMBER"},
            "Direct_Bilirubin": {"type": "NUMBER"},
            "Alkaline_Phosphotase": {"type": "NUMBER"},
            "Alamine_Aminotransferase": {"type": "NUMBER"},
            "Aspartate_Aminotransferase": {"type": "NUMBER"},
            "Total_Protiens": {"type": "NUMBER"},
            "Albumin": {"type": "NUMBER"},
            "Albumin_and_Globulin_Ratio": {"type": "NUMBER"},
        })
    elif disease_id == 'thyroidDisease':
        schema["properties"].update({
            "age": {"type": "NUMBER"},
            "sex": {"type": "NUMBER", "enum": [0, 1]},
            "on_thyroxine": {"type": "NUMBER", "enum": [0, 1]},
            "query_on_thyroxine": {"type": "NUMBER", "enum": [0, 1]},
            "on_antithyroid_meds": {"type": "NUMBER", "enum": [0, 1]},
            "sick": {"type": "NUMBER", "enum": [0, 1]},
            "pregnant": {"type": "NUMBER", "enum": [0, 1]},
            "thyroid_surgery": {"type": "NUMBER", "enum": [0, 1]},
            "I131_treatment": {"type": "NUMBER", "enum": [0, 1]},
            "query_hypothyroid": {"type": "NUMBER", "enum": [0, 1]},
            "query_hyperthyroid": {"type": "NUMBER", "enum": [0, 1]},
            "lithium": {"type": "NUMBER", "enum": [0, 1]},
            "goitre": {"type": "NUMBER", "enum": [0, 1]},
            "tumor": {"type": "NUMBER", "enum": [0, 1]},
            "hypopituitary": {"type": "NUMBER", "enum": [0, 1]},
            "psych": {"type": "NUMBER", "enum": [0, 1]},
            "TSH_measured": {"type": "NUMBER", "enum": [0, 1]},
            "TSH": {"type": "NUMBER"},
            "T3_measured": {"type": "NUMBER", "enum": [0, 1]},
            "T3": {"type": "NUMBER"},
            "TT4_measured": {"type": "NUMBER", "enum": [0, 1]},
            "TT4": {"type": "NUMBER"},
            "T4U_measured": {"type": "NUMBER", "enum": [0, 1]},
            "T4U": {"type": "NUMBER"},
            "FTI_measured": {"type": "NUMBER", "enum": [0, 1]},
            "FTI": {"type": "NUMBER"},
            "TBG_measured": {"type": "NUMBER", "enum": [0, 1]},
            "TBG": {"type": "NUMBER"},
        })
    elif disease_id == 'cancerDisease':
        # Aligning this directly with expected_features in cancer.py
        # Note: 'FamilyHistoryCancer', 'ChronicDisease_Hypertension', 'ChronicDisease_Diabetes',
        # 'Symptoms_Fatigue', 'Symptoms_UnexplainedWeightLoss' are expected as '0' or '1' strings in cancer.py's mapping.
        schema["properties"].update({
            "age": {"type": "NUMBER"},
            "gender": {"type": "STRING", "enum": ["Male", "Female"]}, # Flask maps 'male'/'female' (lowercase)
            "smokingstatus": {"type": "STRING", "enum": ["Never Smoked", "Former Smoker", "Current Smoker"]},
            "alcoholconsumption": {"type": "STRING", "enum": ["None", "Moderate", "Heavy"]},
            "bmi": {"type": "NUMBER"},
            "physicalactivity_hoursperweek": {"type": "NUMBER"},
            "familyhistorycancer": {"type": "STRING", "enum": ["0", "1"]}, # Flask maps '0'/'1' (strings)
            "chronicdisease_hypertension": {"type": "STRING", "enum": ["0", "1"]}, # Flask maps '0'/'1' (strings)
            "chronicdisease_diabetes": {"type": "STRING", "enum": ["0", "1"]}, # Flask maps '0'/'1' (strings)
            "genomicmarker_1": {"type": "NUMBER"},
            "genomicmarker_2": {"type": "NUMBER"},
            "tumorsize_mm": {"type": "NUMBER"},
            # TumorMarkerLevel was None in your console log, so allow null.
            # Make sure to handle null/None in your ML preprocessing if it's not a required feature for the model.
            "tumormarkerlevel": {"type": ["NUMBER", "null"]}, 
            "biopsyresult": {"type": "STRING", "enum": ["Benign", "Malignant", "Not Performed", "Atypical"]},
            "bloodtest_markera": {"type": "NUMBER"},
            "bloodtest_markerb": {"type": "NUMBER"},
            "symptoms_fatigue": {"type": "STRING", "enum": ["0", "1"]}, # Flask maps '0'/'1' (strings)
            "symptoms_unexplainedweightloss": {"type": "STRING", "enum": ["0", "1"]}, # Flask maps '0'/'1' (strings)
        })
        schema["propertyOrdering"] = [
            "disease",
            "age",
            "gender",
            "smokingstatus",
            "alcoholconsumption",
            "bmi",
            "physicalactivity_hoursperweek",
            "familyhistorycancer",
            "chronicdisease_hypertension",
            "chronicdisease_diabetes",
            "genomicmarker_1",
            "genomicmarker_2",
            "tumorsize_mm",
            "tumormarkerlevel", # Added back, check if your ML model expects this
            "biopsyresult",
            "bloodtest_markera",
            "bloodtest_markerb",
            "symptoms_fatigue",
            "symptoms_unexplainedweightloss"
        ]
    else:
        return None # No specific schema for unknown diseases

    return schema


def _get_mock_gemini_response(extracted_text, disease_id):
    """
    Provides a mock structured response from Gemini for testing purposes.
    Ensure this mock matches the structure expected by model_utils.py.
    """
    mock_structured_data = {}
    if "diabetes" in disease_id.lower():
        mock_structured_data = {
            "disease": "diabetes",
            "pregnancies": 1,
            "glucose": 120.0,
            "blood_pressure": 70.0,
            "skin_thickness": 30.0,
            "insulin": 150.0,
            "bmi": 25.5,
            "diabetes_pedigree_function": 0.5,
            "age": 30,
            "gender": "female"
        }
    elif "heartdisease" in disease_id.lower():
        mock_structured_data = {
            "disease": "heartDisease",
            "age": 55,
            "sex": 0,
            "chest_pain_type": 1,
            "trestbps": 130,
            "cholesterol": 220,
            "fbs": 0,
            "restecg": 1,
            "thalach": 150,
            "exang": 1,
            "oldpeak": 1.5,
            "slope": 2,
            "ca": 1,
            "thal": 2,
        }
    elif "hypertension" in disease_id.lower():
        mock_structured_data = {
            "disease": "hypertension",
            "Age_yrs": 60,
            "Gender": 1,
            "Education_Level": 2,
            "Occupation": 0,
            "Physical_Activity": 1,
            "Smoking_Habits": 1,
            "BMI": 30.2,
        }
    elif "ckd" in disease_id.lower():
        mock_structured_data = {
            "disease": "ckd",
            "age": 50,
            "blood_pressure": 130,
            "specific_gravity": 1.015,
            "albumin": 2,
            "sugar": 1,
            "blood_glucose_random": 150,
            "blood_urea": 50,
            "serum_creatinine": 2.0,
            "sodium": 135,
            "potassium": 4.5,
            "hemoglobin": 10.0,
            "packed_cell_volume": 30,
            "white_blood_cell_count": 8000,
            "red_blood_cell_count": 4.0,
            "pus_cell": "abnormal",
            "pus_cell_clumps": "present",
            "bacteria": "notpresent",
            "hypertension": "yes",
            "diabetes_mellitus": "yes",
            "coronary_artery_disease": "no",
            "appetite": "poor",
            "pedal_edema": "yes",
            "anemia": "yes",
        }
    elif "liverdisease" in disease_id.lower():
        mock_structured_data = {
            "disease": "liverDisease",
            "Age": 50,
            "Gender": 0,
            "Total_Bilirubin": 2.5,
            "Direct_Bilirubin": 0.8,
            "Alkaline_Phosphotase": 150,
            "Alamine_Aminotransferase": 60,
            "Aspartate_Aminotransferase": 70,
            "Total_Protiens": 6.8,
            "Albumin": 3.0,
            "Albumin_and_Globulin_Ratio": 0.9,
        }
    elif "thyroiddisease" in disease_id.lower():
        mock_structured_data = {
            "disease": "thyroidDisease",
            "age": 40,
            "sex": 1,
            "on_thyroxine": 0,
            "query_on_thyroxine": 0,
            "on_antithyroid_meds": 0,
            "sick": 0,
            "pregnant": 0,
            "thyroid_surgery": 0,
            "I131_treatment": 0,
            "query_hypothyroid": 1,
            "query_hyperthyroid": 0,
            "lithium": 0,
            "goitre": 0,
            "tumor": 0,
            "hypopituitary": 0,
            "psych": 0,
            "TSH_measured": 1,
            "TSH": 5.2,
            "T3_measured": 1,
            "T3": 1.5,
            "TT4_measured": 1,
            "TT4": 90.0,
            "T4U_measured": 1,
            "T4U": 0.8,
            "FTI_measured": 1,
            "FTI": 110.0,
            "TBG_measured": 0,
            "TBG": -1,
        }
    elif "cancer" in disease_id.lower():
        mock_structured_data = {
            "disease": "cancerDisease",
            "age": 46.0, # Adjusted to match the example log
            "gender": "Male",
            "smokingstatus": "Never Smoked", # Corrected to match expected enum
            "alcoholconsumption": "None", # Added missing field
            "bmi": 27.8,
            "physicalactivity_hoursperweek": 29.8, # Added missing field
            "familyhistorycancer": "0", # Changed to string "0" to match flask mapping
            "chronicdisease_hypertension": "0", # Added missing field, changed to string "0"
            "chronicdisease_diabetes": "0", # Added missing field, changed to string "0"
            "genomicmarker_1": 1, # Added missing field
            "genomicmarker_2": 0, # Added missing field
            "tumorsize_mm": 9.8, # Added missing field
            "tumormarkerlevel": None, # Kept as None, as in your console log
            "biopsyresult": "Benign",
            "bloodtest_markera": 124.6,
            "bloodtest_markerb": 1.3,
            "symptoms_fatigue": "0", # Changed to string "0"
            "symptoms_unexplainedweightloss": "0", # Changed to string "0"
        }
    else:
        mock_structured_data = {
            "disease": "unknown",
            "text_summary": extracted_text[:200],
            "risk_level": "Medium", # Default risk for unknown
            "reason": "Could not determine specific disease parameters from the report. General summary provided."
        }
    return mock_structured_data

