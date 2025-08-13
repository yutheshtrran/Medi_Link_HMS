import os
import zipfile

# Full list of diseases (as provided)
diseases = [
    "Common Cold", "Influenza (Flu)", "COVID-19", "Dengue", "Typhoid", "Malaria", "Chickenpox", "Tuberculosis",
    "Measles", "Mumps", "Hand-Foot-Mouth Disease", "Food Poisoning", "Diarrhea", "Constipation",
    "UTI (Urinary Tract Infection)", "Kidney Infection", "Kidney Stones", "Pneumonia", "Bronchitis",
    "Sinusitis", "Tonsillitis", "Ear Infection", "Stye", "Pink Eye (Conjunctivitis)", "Swimmer’s Ear",
    "Acid Reflux (GERD)", "Ulcer", "Acidity", "Acid Indigestion", "IBS (Irritable Bowel Syndrome)",
    "Flatulence", "Crohn's Disease", "Ulcerative Colitis", "Lactose Intolerance", "Celiac Disease",
    "Pancreatitis", "Liver Cancer", "Barrett’s Esophagus", "Hiatal Hernia", "Throat Burn", "Mouth Ulcers",
    "Tonsil Stones", "Gallstones", "Diabetes", "Hypertension", "Low Blood Pressure", "Hormonal Imbalance",
    "Thyroid Disorders", "PCOS", "Sleep Apnea", "Insomnia", "Chronic Fatigue Syndrome", "Migraines",
    "Fibromyalgia", "Parkinson’s Disease", "Stroke", "Depression", "Anxiety", "Migraine", "Vertigo",
    "Labyrinthitis", "Trigeminal Neuralgia", "Neuropathy", "Alzheimer's Disease", "Skin Allergy",
    "Eczema", "Psoriasis", "Ringworm", "Scabies", "Hives", "Alopecia", "Rosacea", "Calluses",
    "Fungal Nail Infection", "Plantar Warts", "Dandruff", "Menstrual Cramps", "Pelvic Inflammatory Disease",
    "Tonsil Hypertrophy", "Eye Strain", "Dry Eye Syndrome", "Glaucoma", "Macular Degeneration",
    "Blepharitis", "Ruptured Eardrum", "Arthritis", "Migratory Polyarthritis", "Bursitis",
    "Carpal Tunnel Syndrome", "Tennis Elbow", "Shin Splints", "Sciatica", "Plantar Fasciitis",
    "Fracture", "Sprain", "Asthma", "Allergic Rhinitis", "Hay Fever", "Whooping Cough",
    "Sjögren’s Syndrome", "Raynaud’s Disease", "Hidradenitis Suppurativa", "Seasonal Affective Disorder",
    "Sepsis", "Meningitis", "AIDS (HIV)", "Interstitial Cystitis", "Costochondritis", "Epididymitis",
    "Appendicitis", "Hernia"
]

# Create base folder
base_dir = "Disease_Folders"
os.makedirs(base_dir, exist_ok=True)

# Create subfolders
for disease in diseases:
    safe_name = disease.replace("/", "-").replace(":", "").strip()
    folder_path = os.path.join(base_dir, safe_name)
    os.makedirs(folder_path, exist_ok=True)

# Zip the entire folder
zip_filename = "Disease_Folders.zip"
with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(base_dir):
        for dir in dirs:
            folder_path = os.path.join(root, dir)
            arcname = os.path.relpath(folder_path, base_dir)
            zipf.write(folder_path, arcname)

print(f"\n✅ ZIP file created: {zip_filename}")
