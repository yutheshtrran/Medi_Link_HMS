import sys
import os
import random
import pickle
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from PIL import Image
import pytesseract

# =====================
# CONFIGURATION
# =====================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..'))
sys.path.insert(0, PROJECT_ROOT)

UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'txt', 'pdf', 'jpg', 'jpeg', 'png'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# --- ML Model Imports ---
try:
    from ml_model.inference.gemini_response import get_gemini_response
    print("✅ Successfully imported Gemini response helper.")
except ImportError as e:
    print(f"⚠️ Could not import gemini_response: {e}")

# === Route Blueprints ===
from Backend.data import data_bp
from Backend.cv_routes import cv_bp
from Backend.tabular_routes.diabetes import diabetes_bp
from Backend.tabular_routes.heart_disease import heart_bp
from Backend.tabular_routes.hypertension import hypertension_bp
from Backend.tabular_routes.ckd import ckd_bp
from Backend.calculator_routes.health_calculator import health_calc_bp
from Backend.tabular_routes.liver_disease import liver_bp
from Backend.tabular_routes.thyroid import thyroid_bp
from Backend.Routes.report_ocr_route import report_bp
from Backend.tabular_routes.cancer import cancer_bp


# =====================
# FLASK APP CREATION
# =====================
def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Paths to local chatbot models
    TEXT_MODEL_PATH = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model', 'model.pkl')
    VECTORIZER_PATH = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model', 'vectorizer.pkl')
    INTENTS_PATH = os.path.join(PROJECT_ROOT, 'ml_model', 'training', 'data', 'intents.json')

    text_chatbot_model = None
    text_vectorizer = None
    text_intents = None

    # Load local chatbot models and intents
    try:
        with open(TEXT_MODEL_PATH, 'rb') as f:
            text_chatbot_model = pickle.load(f)
        with open(VECTORIZER_PATH, 'rb') as f:
            text_vectorizer = pickle.load(f)
        with open(INTENTS_PATH, 'r') as f:
            text_intents = json.load(f)
        print("✅ Local chatbot models and intents loaded successfully.")
    except Exception as e:
        print(f"⚠️ Could not load local chatbot data: {e}")

    # =====================
    # CHATBOT ROUTE
    # =====================
    @app.route('/chatbot', methods=['POST'])
    def chatbot():
        data = request.get_json()
        message = data.get('message', '').strip()

        if not message:
            return jsonify({'response': "Please enter a message."}), 400

        intent_response = None

        try:
            X = text_vectorizer.transform([message])
            prediction_tag = text_chatbot_model.predict(X)[0]
            for intent in text_intents.get('intents', []):
                if intent['tag'] == prediction_tag:
                    intent_response = random.choice(intent['responses'])
                    break
        except Exception as e:
            print(f"⚠️ Local model error: {e}")

        try:
            reply = get_gemini_response(message, intent_response=intent_response)
            return jsonify({'response': reply})
        except Exception as e:
            print(f"❌ Error generating Gemini response: {e}")
            fallback = intent_response if intent_response else "Sorry, I couldn't generate a response."
            return jsonify({'response': fallback}), 500

    # =====================
    # REPORT ANALYSIS ROUTE (TEXT)
    # =====================
    @app.route('/analyze-report', methods=['POST'])
    def analyze_report():
        data = request.get_json()
        report_text = data.get('reportText', '').strip()

        if not report_text:
            return jsonify({"error": "No report text provided"}), 400

        try:
            summary = get_gemini_response(report_text)
            return jsonify({"summary": summary if summary else ""})
        except Exception as e:
            print(f"❌ Error processing report: {e}")
            return jsonify({"summary": ""}), 500

    # =====================
    # REPORT ANALYSIS ROUTE (FILE UPLOAD)
    # =====================
    @app.route('/analyze-report-file', methods=['POST'])
    def analyze_report_file():
        if 'reportFile' not in request.files:
            return jsonify({'error': 'No file part in request'}), 400

        file = request.files['reportFile']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400

        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)

        report_text = ''
        try:
            ext = filename.lower().split('.')[-1]
            if ext == 'txt':
                with open(file_path, 'r', encoding='utf-8') as f:
                    report_text = f.read()
            elif ext == 'pdf':
                from PyPDF2 import PdfReader
                reader = PdfReader(file_path)
                report_text = '\n'.join([page.extract_text() or '' for page in reader.pages])
            elif ext in {'jpg', 'jpeg', 'png'}:
                img = Image.open(file_path)
                report_text = pytesseract.image_to_string(img)
        except Exception as e:
            print(f"❌ Error extracting text: {e}")
            return jsonify({'error': 'Failed to extract text from file'}), 500

        if not report_text.strip():
            return jsonify({'summary': "👋 I’m MedLink — I couldn’t read text from your file."})

        # =====================
        # MEDICAL CONTENT CHECK
        # =====================
        MEDICAL_KEYWORDS = [
            "diagnosis", "treatment", "surgery", "blood", "patient", "hospital",
            "scan", "ECG", "ICU", "symptom", "disease", "medicine", "injury",
            "fracture", "wound", "infection", "doctor", "report", "therapy",
            "clinical", "pressure", "sugar", "cholesterol", "operation", "x-ray"
        ]

        medical_hits = sum(word.lower() in report_text.lower() for word in MEDICAL_KEYWORDS)
        hospital_terms = ["ward", "consultant", "discharge", "BHT", "admission", "medical", "surgical"]
        hospital_hits = sum(t.lower() in report_text.lower() for t in hospital_terms)

        if medical_hits + hospital_hits < 2:
            return jsonify({
                "summary": "👋 I'm MedLink. I can only analyze health or medical-related reports. "
                           "Please upload a valid medical report."
            })

        # =====================
        # SUMMARIZATION
        # =====================
        try:
            summary = get_gemini_response(report_text) if report_text else ''
            return jsonify({'summary': summary})
        except Exception as e:
            print(f"❌ Error generating summary: {e}")
            return jsonify({'summary': ''}), 500

    # =====================
    # HEALTH CHECK ROUTE
    # =====================
    @app.route('/', methods=['GET'])
    def index():
        return "Medi-Link Backend Server with Gemini 2.5 🚀"

    # =====================
    # REGISTER BLUEPRINTS
    # =====================
    app.register_blueprint(data_bp, url_prefix='/api/statistics')
    app.register_blueprint(cv_bp)
    app.register_blueprint(diabetes_bp)
    app.register_blueprint(heart_bp)
    app.register_blueprint(hypertension_bp)
    app.register_blueprint(ckd_bp)
    app.register_blueprint(liver_bp)
    app.register_blueprint(thyroid_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(cancer_bp)
    app.register_blueprint(health_calc_bp)

    return app


# =====================
# MAIN ENTRY POINT
# =====================
if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5005, debug=True)
