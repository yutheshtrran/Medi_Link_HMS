import pickle
import os

MODEL_DIR = r"D:\DMP_ML\Medi_Link_HMS\ml_model\saved-model"
models = [
    "diabetes_model.pkl",
    "heart_disease_model.pkl",
    "hypertension_model.pkl",
    "ckd_model.pkl",
    "liver_disease_model.pkl",
    "cancer_model.pkl"
]

for model_file in models:
    path = os.path.join(MODEL_DIR, model_file)
    with open(path, "rb") as f:
        model = pickle.load(f)  # load with your current numpy

    with open(path, "wb") as f:
        pickle.dump(model, f)  # re-save with current numpy
    print(f"✅ Re-saved: {model_file}")
