from flask import Blueprint, request, jsonify
import sys
import os

# Add the project root to the Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Import the image prediction function from your ML model
from ml_model.inference.image_predict import predict_disease_from_image

cv_bp = Blueprint('cv_bp', __name__)

@cv_bp.route('/predict-image', methods=['POST'])
def predict_image_api():
    """
    API endpoint for image-based disease prediction.
    Expects a file upload with key 'image'.
    """
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        image_bytes = file.read()  # Read image content into bytes
        prediction = predict_disease_from_image(image_bytes)
        return jsonify({"prediction": prediction}), 200

    except RuntimeError as re:
        # Model loading errors
        return jsonify({"error": str(re)}), 503

    except ValueError as ve:
        # Image processing or prediction errors
        return jsonify({"error": f"Invalid image or prediction error: {str(ve)}"}), 400

    except Exception as e:
        # Catch-all for unexpected errors
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500
