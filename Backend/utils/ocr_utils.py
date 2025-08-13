import pytesseract 
import cv2
import fitz  # PyMuPDF
from PIL import Image # Pillow
import os
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"


def extract_text_from_file(filepath, disease_id=None):
    """
    Extracts text from a file (PDF or image) given its filepath.
    Handles both searchable PDFs (direct text extraction) and scanned PDFs/images (OCR).
    Raises ValueError on unsupported file types or extraction errors.
    """
    ext = os.path.splitext(filepath)[1].lower()

    if ext == '.pdf':
        print(f"OCR: Processing PDF file: {filepath}")
        return _extract_text_from_pdf(filepath)
    elif ext in ['.png', '.jpg', '.jpeg']:
        print(f"OCR: Processing image file: {filepath}")
        return _extract_text_from_image(filepath)
    else:
        raise ValueError(f"Unsupported file type for OCR: {ext}. Only .pdf, .png, .jpg, .jpeg are supported.")

def _extract_text_from_pdf(pdf_path):
    """
    Extracts text from a PDF document.
    Attempts direct text extraction first, then falls back to OCR if no text is found.
    """
    full_text = ""
    try:
        doc = fitz.open(pdf_path)
        if not doc.page_count:
            return "" # Empty PDF

        # Attempt direct text extraction first (for searchable PDFs)
        for page_num in range(doc.page_count):
            page = doc.load_page(page_num)
            full_text += page.get_text()
        
        doc.close()

        if full_text.strip():
            print("OCR: Successfully extracted text directly from PDF.")
            return full_text.strip()
        else:
            print("OCR: No direct text found in PDF. Attempting OCR on each page...")
            # Fallback to OCR if no text was found directly (implies scanned PDF)
            return _ocr_pdf_pages(pdf_path)

    except Exception as e:
        print(f"OCR: Error during PDF text extraction (direct or OCR fallback): {e}")
        # If direct extraction fails, and then OCR fallback also fails, or initial open fails
        raise ValueError(f"Failed to extract text from PDF: {str(e)}. Ensure PyMuPDF and Tesseract are correctly installed and configured.")

def _ocr_pdf_pages(pdf_path):
    """
    Performs OCR on each page of a PDF by converting pages to images.
    """
    ocr_text = ""
    try:
        doc = fitz.open(pdf_path)
        for page_num, page in enumerate(doc):
            # Render page to a high-resolution pixmap (image)
            pix = page.get_pixmap(dpi=300) # Increased DPI for better OCR accuracy
            # Convert pixmap to PIL Image
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            # Perform OCR using Tesseract
            page_text = pytesseract.image_to_string(img)
            ocr_text += page_text + "\n--- End of Page " + str(page_num + 1) + " ---\n"
        doc.close()
        
        if not ocr_text.strip():
            print(f"OCR: Warning: No significant text extracted from PDF {pdf_path} via OCR.")
        return ocr_text.strip()

    except Exception as e:
        print(f"OCR: Error during PDF page OCR for {pdf_path}: {e}")
        raise ValueError(f"Failed to perform OCR on PDF pages: {str(e)}. Ensure Tesseract OCR is installed and configured.")

def _extract_text_from_image(image_path):
    """
    Extracts text from an image file using Tesseract OCR.
    """
    try:
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not read image file. Check if file exists and is a valid image: {image_path}")
        
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        # You might add image preprocessing here (e.g., thresholding, denoising)
        # ret, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        # text = pytesseract.image_to_string(thresh)
        
        text = pytesseract.image_to_string(gray)
        if not text.strip():
            print(f"OCR: Warning: No significant text extracted from image {image_path}.")
        return text.strip()

    except Exception as e:
        print(f"OCR: Error during image OCR for {image_path}: {e}")
        raise ValueError(f"Failed to perform OCR on image: {str(e)}. Ensure OpenCV and Tesseract are correctly installed and configured.")