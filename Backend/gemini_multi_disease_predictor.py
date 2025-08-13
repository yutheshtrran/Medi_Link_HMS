import os
import fitz  # ← from PyMuPDF
import pytesseract
from PIL import Image
import io
from google.generativeai import GenerativeModel, configure

# === 1. Configure Gemini API ===
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")  # Set this in your environment
configure(api_key=GEMINI_API_KEY)
gemini = GenerativeModel("gemini-pro")

# === 2. OCR from PDF ===
def extract_text_from_pdf(file_path):
    text = ""
    with fitz.open(file_path) as pdf:
        for page in pdf:
            text += page.get_text()
    return text.strip()

# === 3. OCR from image ===
def extract_text_from_image(file_path):
    image = Image.open(file_path)
    text = pytesseract.image_to_string(image)
    return text.strip()

# === 4. Unified report text extractor ===
def extract_text_from_report(file_path):
    _, ext = os.path.splitext(file_path.lower())
    if ext in [".pdf"]:
        return extract_text_from_pdf(file_path)
    elif ext in [".png", ".jpg", ".jpeg", ".bmp", ".tiff"]:
        return extract_text_from_image(file_path)
    else:
        raise ValueError("Unsupported file format for OCR.")

# === 5. Gemini disease inference ===
def predict_disease_from_report_text(text):
    prompt = f"""
You are a senior medical AI assistant. Analyze the following patient's medical report and infer the most probable diseases.
Also list risk factors and relevant health indicators (like blood sugar, pressure, creatinine, bilirubin, etc.).

Report:
{text}

Return the result in this JSON format:
{{
  "probable_diseases": ["..."],
  "risk_factors": ["..."],
  "key_findings": ["..."],
  "confidence": "High/Medium/Low"
}}
"""
    try:
        response = gemini.generate_content(prompt)
        return response.text
    except Exception as e:
        return {"error": f"Gemini analysis failed: {str(e)}"}
