# Backend/data.py
from flask import Blueprint, jsonify
import pandas as pd
import os

# Create a Blueprint instance
data_bp = Blueprint('data_bp', __name__)

# --- Configuration for Excel Data ---
# Get the directory of the current file (data.py)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Define the path to your Excel file relative to this directory
EXCEL_FILE_PATH = os.path.join(BASE_DIR, 'medical_data.xlsx')

# Global variables to hold the loaded data
disease_prevalence_data = []
awareness_data = []
consultation_rates_data = []

# --- Data Loading Function ---
def _load_data_from_excel():
    """
    Loads all data from the specified Excel file and its sheets.
    Handles FileNotFoundError and other loading issues.
    """
    global disease_prevalence_data, awareness_data, consultation_rates_data

    # Check if the Excel file exists before attempting to load
    if not os.path.exists(EXCEL_FILE_PATH):
        print(f"❌ Error: Excel file not found at {EXCEL_FILE_PATH}.")
        print("Please ensure 'medical_data.xlsx' is in the 'Backend' directory.")
        # Data will remain empty lists if file is not found
        return

    try:
        print(f"Attempting to load data from: {EXCEL_FILE_PATH}")

        # Load Disease Prevalence Data from 'Disease Prevalence' sheet
        df_prevalence = pd.read_excel(EXCEL_FILE_PATH, sheet_name='Disease Prevalence')
        disease_prevalence_data = df_prevalence.to_dict(orient='records')
        print("✅ Disease Prevalence data loaded from Excel.")

        # Load Awareness Data from 'Awareness Rates' sheet
        df_awareness = pd.read_excel(EXCEL_FILE_PATH, sheet_name='Awareness Rates')
        awareness_data = df_awareness.to_dict(orient='records')
        print("✅ Awareness Rates data loaded from Excel.")

        # Load Consultation Rates Data from 'Consultation Rates' sheet
        df_consultation = pd.read_excel(EXCEL_FILE_PATH, sheet_name='Consultation Rates')
        # Assuming 'daily_consultations' is the column name in the Excel sheet
        consultation_rates_data = df_consultation['daily_consultations'].tolist()
        print("✅ Consultation Rates data loaded from Excel.")

    except KeyError as e:
        print(f"❌ Error reading Excel sheet or column: {e}")
        print("Please verify that sheet names ('Disease Prevalence', 'Awareness Rates', 'Consultation Rates') and column headers are correct.")
        print("For 'Consultation Rates' sheet, ensure a column named 'daily_consultations' exists.")
    except pd.errors.EmptyDataError:
        print(f"❌ Error: Excel file or one of its sheets is empty: {EXCEL_FILE_PATH}")
    except Exception as e:
        print(f"❌ An unexpected error occurred while loading Excel data: {e}")
        print("Ensure 'openpyxl' is installed (pip install openpyxl).")

# Call the loading function immediately when the blueprint is loaded
_load_data_from_excel()


# --- API Endpoints ---
@data_bp.route('/disease_prevalence', methods=['GET'])
def get_disease_prevalence():
    """
    Returns data for disease prevalence (cases and deaths), loaded from Excel.
    """
    return jsonify(disease_prevalence_data)

@data_bp.route('/awareness_rates', methods=['GET'])
def get_awareness_rates():
    """
    Returns data for public awareness rates, loaded from Excel.
    """
    return jsonify(awareness_data)

@data_bp.route('/consultation_rates', methods=['GET'])
def get_consultation_rates():
    """
    Returns data for daily consultation rates, loaded from Excel.
    """
    return jsonify(consultation_rates_data)

# No if __name__ == '__main__': block here because this is a blueprint,
# not the main application entry point.