import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io

# Set path to tesseract executable
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Load your PDF
pdf_path = "sample_report.pdf"  # 🔁 Replace with your file
doc = fitz.open(pdf_path)

# Loop through pages
for i, page in enumerate(doc):
    pix = page.get_pixmap(dpi=300)  # High resolution improves OCR
    img = Image.open(io.BytesIO(pix.tobytes()))
    text = pytesseract.image_to_string(img)
    
    print(f"\n📄 Page {i+1} Text:\n{text}")
