import pytesseract
from PIL import Image
import cv2

# OPTIONAL: Set the path to Tesseract executable if you're on Windows
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Path to the image
image_path = "sample_image.png"

# Load image using OpenCV
image = cv2.imread(image_path)

# Convert to grayscale for better OCR
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# Threshold to clean the image
gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

# Extract text using Tesseract OCR
text = pytesseract.image_to_string(gray)

# Print the extracted text
print("\n📝 Extracted Text:\n")
print(text)
