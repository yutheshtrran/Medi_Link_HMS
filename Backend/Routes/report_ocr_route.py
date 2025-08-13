import os
import sys
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import tempfile # Import tempfile for temporary file handling
import json # Import json to handle structured_data_dict

# Setup sys.path for imports (ensure PROJECT_ROOT is correctly added)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# PROJECT_ROOT is one level up from 'Backend'
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..', '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Import necessary modules based on your architecture
from Backend.utils.ocr_utils import extract_text_from_file
from Backend.gemini.gemini_client import call_gemini_api # Corrected import name
from Backend.utils.model_utils import predict_from_text # Import the ML prediction helper

report_bp = Blueprint('report_ocr', __name__, url_prefix='/predict') # Added url_prefix for clarity

# Define UPLOAD_FOLDER (not directly used for temp files, but good for structure)
UPLOAD_FOLDER = os.path.join(PROJECT_ROOT, 'backend', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True) # Ensure the upload directory exists

@report_bp.route('/upload', methods=['POST'])
def upload_report_and_predict():
    print("--- Entered upload_report_and_predict function ---")
    print("🔁 Request received.")
    print("📁 request.files:", request.files)
    print("📄 request.form:", request.form) # Check form data for disease_id

    if 'file' not in request.files:
        print("Error: No 'file' part in the request.")
        return jsonify({
            "error": "No file part in the request.",
            "risk_level": "Error",
            "reason": "Please select a file to upload."
        }), 400

    file = request.files['file']
    disease_id = request.form.get('disease_id') # Extract disease_id from form data

    print("✅ File received:", file.filename)

    if file.filename == '':
        print("Error: File is empty (no filename).")
        return jsonify({
            "error": "No selected file.",
            "risk_level": "Error",
            "reason": "No file selected for upload."
        }), 400

    if not disease_id:
        print("Error: 'disease_id' not provided in form data.")
        return jsonify({
            "error": "Disease ID not provided.",
            "risk_level": "Error",
            "reason": "Disease type not specified for report analysis."
        }), 400

    temp_filepath = None # Initialize to None for cleanup in finally block
    try:
        # Create a temporary file to save the uploaded content
        # Use tempfile.NamedTemporaryFile to get a unique, safely handled file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            file.save(temp_file.name)
            temp_filepath = temp_file.name # Store the actual path
        print(f"File saved temporarily to: {temp_filepath}")

        # Step 1: Extract raw text using OCR
        print("Step 1: Extracting text using OCR...")
        # Pass the temporary file's path to the OCR utility
        extracted_text = extract_text_from_file(temp_filepath, disease_id) 
        print(f"OCR Extracted Text (first 200 chars): {extracted_text[:200]}...")

        # Step 2: Pass to Gemini to get structured data (Python dictionary)
        print("Step 2: Calling Gemini API for structuring data...")
        structured_data_dict = call_gemini_api(extracted_text, disease_id)
        print(f"Gemini Structured Data (Python dict): {structured_data_dict}")

        # Step 3: Run prediction on structured data
        print("Step 3: Running ML prediction...")
        prediction_result = predict_from_text(structured_data_dict, disease_id)
        print(f"ML Prediction Result: {prediction_result}")

        # Directly return the prediction_result, which should contain 'risk_level' and 'reason'
        if prediction_result and 'risk_level' in prediction_result and 'reason' in prediction_result:
            # --- ADDED THIS PRINT STATEMENT ---
            print(f"Backend returning JSON: {json.dumps(prediction_result, indent=2)}")
            # --- END ADDITION ---
            return jsonify(prediction_result), 200 # Return the expected format
        else:
            print("Error: Final prediction result from model_utils.py was malformed (missing risk_level or reason).")
            return jsonify({
                'error': 'Final prediction result from AI was malformed (missing risk_level or reason).',
                'risk_level': 'Error',
                'reason': 'AI model did not return a valid prediction format.'
            }), 500

    except ValueError as ve:
        # Handle specific data/file processing errors
        print(f"ValueError during processing: {ve}")
        return jsonify({
            'error': str(ve),
            'risk_level': 'Error',
            'reason': f'File processing error: {str(ve)}'
        }), 400
    except Exception as e:
        # Catch any other unexpected errors during processing
        print(f"🔥 Unhandled Exception during report upload and prediction: {e}", exc_info=True)
        return jsonify({
            "error": f"Internal server error during report analysis: {str(e)}",
            "risk_level": "Error",
            "reason": "An internal server error occurred during report analysis. Please check backend logs for details."
        }), 500
    finally:
        # Ensure the temporary file is cleaned up in all cases
        if temp_filepath and os.path.exists(temp_filepath):
            os.remove(temp_filepath)
            print(f"Cleaned up temporary file: {temp_filepath}")