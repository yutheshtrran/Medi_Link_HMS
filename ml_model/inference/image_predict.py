import os
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import io

# --- Model Loading (to be used by Flask) ---
# Get the absolute path to the 'ml_model' directory
ML_MODEL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # This is 'project-root/ml_model'

# Path to the saved PyTorch model
MODEL_PATH = os.path.join(ML_MODEL_DIR, 'saved-model', 'cv_model.pth')

# Initialize model and class_names globally so they are loaded once
model = None
class_names = []
transform = None

def load_cv_model():
    """Loads the PyTorch CV model and its associated assets."""
    global model, class_names, transform # Declare intent to modify global variables

    if os.path.exists(MODEL_PATH):
        try:
            checkpoint = torch.load(MODEL_PATH, map_location=torch.device('cpu'))

            # Recreate the model architecture (e.g., ResNet18)
            model = models.resnet18(pretrained=False)

            # Ensure class_names exist in checkpoint to set FC layer correctly
            loaded_class_names = checkpoint.get('class_names')
            if loaded_class_names is None or not isinstance(loaded_class_names, list) or len(loaded_class_names) == 0:
                raise ValueError("Class names not found or invalid in checkpoint.")

            model.fc = nn.Linear(model.fc.in_features, len(loaded_class_names))
            model.load_state_dict(checkpoint['model_state_dict'])
            model.eval() # Set model to evaluation mode

            class_names = loaded_class_names
            print(f"✅ CV Model loaded successfully from {MODEL_PATH}. Classes: {class_names}")

            # Define the transforms (must be the same as training)
            transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor()
            ])

        except Exception as e:
            print(f"❌ Failed to load CV model or process checkpoint: {e}")
            model = None # Ensure model is None on failure
            class_names = []
            transform = None
    else:
        print(f"⚠️ CV Model file not found at {MODEL_PATH}. Prediction will not work.")
        model = None
        class_names = []
        transform = None

# Load the model when this module is imported
load_cv_model()

def predict_disease_from_image(image_bytes):
    """
    Predicts the disease from raw image bytes using the loaded CV model.
    """
    if model is None or transform is None or not class_names:
        raise RuntimeError("CV model not loaded or initialized properly. Cannot make prediction.")

    try:
        # Open image from bytes stream
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        image = transform(image).unsqueeze(0) # Add batch dimension

        with torch.no_grad():
            output = model(image)
            _, predicted = torch.max(output, 1)

        return class_names[predicted.item()]
    except Exception as e:
        raise ValueError(f"Error during image processing or prediction: {e}")

# Example usage (for testing this script directly)
if __name__ == '__main__':
    # This part would typically be used for direct script testing, not Flask.
    # Make sure you have a dummy image file for testing, e.g., test_image.jpg
    # Adjust this path to a real image in your training data for testing.
    dummy_image_path = os.path.join(ML_MODEL_DIR, 'training', 'data', 'images', 'pneumonia', 'CHEST_NORMAL2.jpg') # Example path
    if os.path.exists(dummy_image_path):
        print(f"Attempting prediction with dummy image: {dummy_image_path}")
        with open(dummy_image_path, 'rb') as f:
            image_data = f.read()
        try:
            prediction = predict_disease_from_image(image_data)
            print(f"Predicted Disease: {prediction}")
        except Exception as e:
            print(f"Prediction failed: {e}")
    else:
        print(f"Dummy image for testing not found at {dummy_image_path}. Please update 'dummy_image_path' to a valid image in your dataset for local testing.")