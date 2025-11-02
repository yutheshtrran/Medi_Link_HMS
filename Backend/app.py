import sys
import os
import random
import pickle
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

# =====================
# CONFIGURATION
# =====================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..'))
sys.path.insert(0, PROJECT_ROOT)

# --- ML Model Imports ---
try:
    from ml_model.inference.image_predict import predict_disease_from_image
    print("✅ Successfully imported predict_disease_from_image.")
except ImportError as e:
    print(f"⚠️ Could not import image_predict: {e}")

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

        # Step 1: Try local chatbot first
        try:
            X = text_vectorizer.transform([message])
            prediction_tag = text_chatbot_model.predict(X)[0]

            for intent in text_intents.get('intents', []):
                if intent['tag'] == prediction_tag:
                    intent_response = random.choice(intent['responses'])
                    break
        except Exception as e:
            print(f"⚠️ Local model error: {e}")

        # Step 2: Use Gemini to enhance or generate if needed
        try:
            reply = get_gemini_response(message, intent_response=intent_response)
            return jsonify({'response': reply})
        except Exception as e:
            print(f"❌ Error generating Gemini response: {e}")
            fallback = intent_response if intent_response else "Sorry, I couldn't generate a response."
            return jsonify({'response': fallback}), 500

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
