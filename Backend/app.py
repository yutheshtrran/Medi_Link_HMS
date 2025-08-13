# Backend/app.py
import sys
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import json
import random


# BASE_DIR points to the 'Backend' folder where app.py resides
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# PROJECT_ROOT points to the 'Medi_Link' folder, one level up from 'Backend'
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..'))
sys.path.insert(0, PROJECT_ROOT) # Add project root to sys.path for module imports


# --- ML Model Inference Imports ---
# Make sure this path is correct relative to PROJECT_ROOT
try:
    from ml_model.inference.image_predict import predict_disease_from_image
    print("✅ Successfully imported predict_disease_from_image.")
except ImportError as e:
    print(f"❌ Error importing predict_disease_from_image: {e}")
    print("Ensure 'ml_model/inference/image_predict.py' exists and is correctly configured.")

# === Route Blueprints ===
# Import your data blueprint (assuming it's in the same directory as app.py)
from .data import data_bp

# Import other blueprints
from .cv_routes import cv_bp
from .tabular_routes.diabetes import diabetes_bp
from .tabular_routes.heart_disease import heart_bp
from .tabular_routes.hypertension import hypertension_bp
from .tabular_routes.ckd import ckd_bp
from .calculator_routes.health_calculator import health_calc_bp
from .tabular_routes.liver_disease import liver_bp
from .tabular_routes.thyroid import thyroid_bp
from .Routes.report_ocr_route import report_bp # Note: inconsistent capitalization here, usually 'routes'
from .tabular_routes.cancer import cancer_bp

def create_app():
    """
    Flask application factory function.
    Initializes and configures the Flask app, registers blueprints.
    """
    app = Flask(__name__)
    # Enable CORS for all routes and origins, allowing frontend to connect
    CORS(app, resources={r"/*": {"origins": "*"}})

    # === Text Chatbot Setup ===
    # Define paths to chatbot model files relative to PROJECT_ROOT
    TEXT_MODEL_PATH = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model', 'model.pkl')
    VECTORIZER_PATH = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model', 'vectorizer.pkl')
    INTENTS_PATH = os.path.join(PROJECT_ROOT, 'ml_model', 'training', 'data', 'intents.json')

    # Initialize chatbot components to None
    text_chatbot_model = None
    text_vectorizer = None
    text_intents = None

    # Attempt to load chatbot models and intents
    try:
        if os.path.exists(TEXT_MODEL_PATH):
            with open(TEXT_MODEL_PATH, 'rb') as f:
                text_chatbot_model = pickle.load(f)

        if os.path.exists(VECTORIZER_PATH):
            with open(VECTORIZER_PATH, 'rb') as f:
                text_vectorizer = pickle.load(f)

        if os.path.exists(INTENTS_PATH):
            with open(INTENTS_PATH, 'r') as f:
                text_intents = json.load(f)

        print("✅ Text chatbot models and intents loaded successfully.")
    except FileNotFoundError as e:
        print(f"⚠️ Warning: Text chatbot model/data not found: {e}")
        print(f"   Expected paths: Model={TEXT_MODEL_PATH}, Vectorizer={VECTORIZER_PATH}, Intents={INTENTS_PATH}")
    except Exception as e:
        print(f"❌ Error loading text chatbot model/data: {e}")

    @app.route('/chatbot', methods=['POST'])
    def chatbot():
        """
        Handles chatbot interactions. Receives a message and returns a response.
        """
        # Check if chatbot components are loaded
        if not text_chatbot_model or not text_vectorizer or not text_intents:
            return jsonify({'response': "Chatbot model or data not loaded. Please check server logs."}), 500

        data = request.get_json()
        message = data.get('message', '')

        # Validate incoming message
        if not message or not message.strip():
            return jsonify({'response': "Please enter a message."}), 400

        try:
            # Transform the message using the loaded vectorizer
            X = text_vectorizer.transform([message])
            # Predict the intent tag using the loaded model
            prediction_tag = text_chatbot_model.predict(X)[0]

            # Find the corresponding intent and return a random response
            for intent in text_intents.get('intents', []):
                if intent['tag'] == prediction_tag:
                    return jsonify({'response': random.choice(intent['responses'])})

            # If no matching intent is found
            return jsonify({'response': "Sorry, I don't understand your query. Can you please rephrase?"})
        except Exception as e:
            # Log and return an internal server error if prediction fails
            print(f"Error during chatbot prediction: {e}")
            return jsonify({'response': "Internal server error during chatbot processing."}), 500

    @app.route('/')
    def index():
        """
        Root endpoint to confirm the server is running.
        """
        return "Medi-Link Backend Server is Running! 🚀"

    # === Register All Blueprints ===
    # Each blueprint registration now includes a url_prefix for better API organization.
    # Frontend fetch calls must match these prefixes.
    app.register_blueprint(data_bp, url_prefix='/api/statistics') # Chart data, e.g., /api/statistics/disease_prevalence
    app.register_blueprint(cv_bp) # Computer Vision, e.g., /api/cv/predict_image
    app.register_blueprint(diabetes_bp) # Tabular Diabetes, e.g., /api/diabetes/predict
    app.register_blueprint(heart_bp)
    app.register_blueprint(hypertension_bp)
    app.register_blueprint(ckd_bp)
    app.register_blueprint(health_calc_bp)
    app.register_blueprint(liver_bp)
    app.register_blueprint(thyroid_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(cancer_bp)

    return app

# Run the app if this script is executed directly
if __name__ == '__main__':
    app = create_app()
    # Run in debug mode for development (auto-reloads, detailed errors)
    # For production, set debug=False and use a production-ready WSGI server (e.g., Gunicorn)
    app.run(host='0.0.0.0', port=5005, debug=True)