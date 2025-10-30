import pandas as pd
import numpy as np # Import numpy for np.nan
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer # Explicitly import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
import pickle
import os
import traceback
import joblib
# Import traceback for detailed error logging

# Define the project root dynamically
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..', '..'))

DATA_DIR = os.path.join(PROJECT_ROOT, 'ml_model', 'training', 'data', 'disease_data')
SAVE_MODEL_DIR = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model')

os.makedirs(SAVE_MODEL_DIR, exist_ok=True)

print(f"Project Root: {PROJECT_ROOT}")
print(f"Data Directory: {DATA_DIR}")
print(f"Save Model Directory: {SAVE_MODEL_DIR}")

# --- 1. Diabetes Model Training ---
print("\n--- Training Diabetes Model ---")
DIABETES_DATA_PATH = os.path.join(DATA_DIR, 'diabetes_dataset.xlsx')

try:
    df_diabetes = pd.read_excel(DIABETES_DATA_PATH)
    print("Diabetes dataset loaded successfully.")
    print("Diabetes Data Head:\n", df_diabetes.head())

    # Assuming columns are correct as-is and no special cleaning needed for diabetes
    X_diabetes = df_diabetes.drop('Outcome', axis=1)
    y_diabetes = df_diabetes['Outcome']

    model_diabetes = LogisticRegression(random_state=42, solver='liblinear', max_iter=200)

    X_train_diabetes, X_test_diabetes, y_train_diabetes, y_test_diabetes = train_test_split(
        X_diabetes, y_diabetes, test_size=0.2, random_state=42, stratify=y_diabetes
    )

    model_diabetes.fit(X_train_diabetes, y_train_diabetes)
    accuracy_diabetes = model_diabetes.score(X_test_diabetes, y_test_diabetes)
    print(f"Diabetes Model Accuracy: {accuracy_diabetes:.4f}")

    diabetes_model_path = os.path.join(SAVE_MODEL_DIR, 'diabetes_model.pkl')
    with open(diabetes_model_path, 'wb') as f:
        pickle.dump(model_diabetes, f)
    print(f"✅ Diabetes model saved to {diabetes_model_path}")

except FileNotFoundError:
    print(f"⚠️ Warning: Diabetes dataset not found at {DIABETES_DATA_PATH}. Skipping Diabetes model training.")
except Exception as e:
    print(f"❌ Error training Diabetes model: {e}")
    import traceback
    traceback.print_exc()

# --- 2. Heart Disease Model Training ---
print("\n--- Training Heart Disease Model ---")
HEART_DISEASE_DATA_PATH = os.path.join(DATA_DIR, 'heart_disease_dataset.xlsx')

try:
    df_heart = pd.read_excel(HEART_DISEASE_DATA_PATH)
    print("Heart Disease dataset loaded successfully.")
    print("Heart Disease Data Head:\n", df_heart.head())

    # Rename columns as per your dataset (ensure these match your actual Excel headers)
    # The current rename operation effectively renames them to themselves, which is fine
    # if the column names are already correct.
    df_heart.rename(columns={
        'age': 'age', 'sex': 'sex', 'cp': 'cp', 'trestbps': 'trestbps',
        'chol': 'chol', 'fbs': 'fbs', 'restecg': 'restecg', 'thalach': 'thalach',
        'exang': 'exang', 'oldpeak': 'oldpeak', 'slope': 'slope', 'ca': 'ca',
        'thal': 'thal', 'target': 'target'
    }, inplace=True)

    X_heart = df_heart.drop('target', axis=1)
    y_heart = df_heart['target']

    # All features are numerical and will be scaled
    numerical_features_heart = X_heart.columns.tolist()

    # Preprocessor for Heart Disease model (only StandardScaler)
    preprocessor_heart = StandardScaler()

    model_heart_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor_heart),
        ('classifier', LogisticRegression(random_state=42, solver='liblinear', max_iter=200))
    ])

    X_train_heart, X_test_heart, y_train_heart, y_test_heart = train_test_split(
        X_heart, y_heart, test_size=0.2, random_state=42, stratify=y_heart
    )

    model_heart_pipeline.fit(X_train_heart, y_train_heart)
    accuracy_heart = model_heart_pipeline.score(X_test_heart, y_test_heart)
    print(f"Heart Disease Model Accuracy: {accuracy_heart:.4f}")

    # Save only the classifier and scaler separately
    heart_model_path = os.path.join(SAVE_MODEL_DIR, 'heart_disease_model.pkl')
    with open(heart_model_path, 'wb') as f:
        pickle.dump(model_heart_pipeline.named_steps['classifier'], f)
    print(f"✅ Heart Disease model saved to {heart_model_path}")

    heart_scaler_path = os.path.join(SAVE_MODEL_DIR, 'heart_disease_scaler.pkl')
    with open(heart_scaler_path, 'wb') as f:
        pickle.dump(model_heart_pipeline.named_steps['preprocessor'], f)
    print(f"✅ Heart Disease scaler saved to {heart_scaler_path}")

except FileNotFoundError:
    print(f"⚠️ Warning: Heart Disease dataset not found at {HEART_DISEASE_DATA_PATH}. Skipping Heart Disease model training.")
except Exception as e:
    print(f"❌ Error training Heart Disease model: {e}")
    import traceback
    traceback.print_exc()

# --- 3. Hypertension Model Training ---
print("\n--- Training Hypertension Model ---")
HYPERTENSION_DATA_PATH = os.path.join(DATA_DIR, 'hypertension_dataset.xlsx')

try:
    df_hypertension = pd.read_excel(HYPERTENSION_DATA_PATH)
    print("Hypertension dataset loaded successfully.")
    print("Hypertension Data Head:\n", df_hypertension.head())

    # Rename columns for consistency (ensure these match your actual Excel headers)
    df_hypertension.rename(columns={
        'Age_yrs': 'Age_yrs',
        'Gender': 'Gender',
        'Education_Level': 'Education_Level',
        'Occupation': 'Occupation',
        'Physical Activity': 'Physical_Activity',  # Renamed from 'Physical Activity'
        'Smoking Habits': 'Smoking_Habits',        # Renamed from 'Smoking Habits'
        'BMI': 'BMI',
        'Hypertension (Y/N)': 'Hypertension'       # Renamed from 'Hypertension (Y/N)'
    }, inplace=True)

    # Convert target Y/N to 1/0
    df_hypertension['Hypertension'] = df_hypertension['Hypertension'].apply(lambda x: 1 if str(x).strip().upper() == 'Y' else 0)

    X_hypertension = df_hypertension.drop('Hypertension', axis=1)
    y_hypertension = df_hypertension['Hypertension']

    numerical_features_hypertension = ['Age_yrs', 'BMI']
    categorical_features_hypertension = ['Gender', 'Education_Level', 'Occupation', 'Physical_Activity', 'Smoking_Habits']

    preprocessor_hypertension = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_features_hypertension),
            # Using separate OneHotEncoders for each categorical feature for clarity
            # and to allow different 'drop' strategies if needed.
            ('cat_gender', OneHotEncoder(handle_unknown='ignore', sparse_output=False), ['Gender']),
            ('cat_edu', OneHotEncoder(handle_unknown='ignore', drop='first', sparse_output=False), ['Education_Level']),
            ('cat_occ', OneHotEncoder(handle_unknown='ignore', drop='first', sparse_output=False), ['Occupation']),
            ('cat_phys', OneHotEncoder(handle_unknown='ignore', drop='first', sparse_output=False), ['Physical_Activity']),
            ('cat_smoke', OneHotEncoder(handle_unknown='ignore', drop='first', sparse_output=False), ['Smoking_Habits'])
        ],
        remainder='passthrough'
    )

    model_hypertension_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor_hypertension),
        ('classifier', LogisticRegression(random_state=42, solver='liblinear', max_iter=200))
    ])

    X_train_hypertension, X_test_hypertension, y_train_hypertension, y_test_hypertension = train_test_split(
        X_hypertension, y_hypertension, test_size=0.2, random_state=42, stratify=y_hypertension
    )

    model_hypertension_pipeline.fit(X_train_hypertension, y_train_hypertension)
    accuracy_hypertension = model_hypertension_pipeline.score(X_test_hypertension, y_test_hypertension)
    print(f"Hypertension Model Accuracy: {accuracy_hypertension:.4f}")

    # Save only the classifier and preprocessor separately
    hypertension_model_path = os.path.join(SAVE_MODEL_DIR, 'hypertension_model.pkl')
    with open(hypertension_model_path, 'wb') as f:
        pickle.dump(model_hypertension_pipeline.named_steps['classifier'], f)
    print(f"✅ Hypertension model saved to {hypertension_model_path}")

    hypertension_preprocessor_path = os.path.join(SAVE_MODEL_DIR, 'hypertension_preprocessor.pkl')
    with open(hypertension_preprocessor_path, 'wb') as f:
        pickle.dump(model_hypertension_pipeline.named_steps['preprocessor'], f)
    print(f"✅ Hypertension preprocessor saved to {hypertension_preprocessor_path}")

    if hasattr(model_hypertension_pipeline.named_steps['preprocessor'], 'get_feature_names_out'):
        feature_names_out = model_hypertension_pipeline.named_steps['preprocessor'].get_feature_names_out()
        print(f"Hypertension Preprocessor Output Features ({len(feature_names_out)}):\n{feature_names_out.tolist()}")
    else:
        print("Could not get feature names from Hypertension preprocessor (older scikit-learn version?).")

except FileNotFoundError:
    print(f"⚠️ Warning: Hypertension dataset not found at {HYPERTENSION_DATA_PATH}. Skipping Hypertension model training.")
except Exception as e:
    print(f"❌ Error training Hypertension model: {e}")
    import traceback
    traceback.print_exc()

# --- 4. CKD Model Training ---
print("\n--- Training CKD Model ---")
CKD_DATA_PATH = os.path.join(DATA_DIR, 'kidney_disease.xlsx')

try:
    # Define known missing value indicators, including the problematic '\t?'
    missing_values = ['\t?', '?', ' ', '', '\t', 'na', 'n/a', 'NA', '--', '-', '\t\t']

    # Load the dataset, instructing pandas to recognize these as NaN directly
    df_ckd = pd.read_excel(CKD_DATA_PATH, na_values=missing_values)
    print("CKD dataset loaded successfully.")
    print("CKD Data Head (before column name cleaning):\n", df_ckd.head())

    # Clean column names (strip spaces, remove quotes, convert to lowercase)
    df_ckd.columns = df_ckd.columns.str.strip().str.replace('"', '').str.lower()
    print(f"CKD Columns after cleaning and lowercasing: {df_ckd.columns.tolist()}")

    # Drop 'patient id' if it exists and is not a feature
    if 'patient id' in df_ckd.columns:
        df_ckd = df_ckd.drop(columns=['patient id'])

    target_col = 'classification' # Your output shows 'classification'
    if target_col not in df_ckd.columns:
        raise ValueError(f"Target column '{target_col}' not found in CKD dataset. Available columns: {df_ckd.columns.tolist()}")

    # Convert target to binary (ckd/notckd to 1/0)
    # Ensure target column is handled before splitting features/target
    y_ckd = df_ckd[target_col].apply(lambda x: 1 if str(x).lower().strip() in ['ckd', 'ckd detected'] else 0)

    # --- IMPORTANT FIX: Corrected Feature Lists based on your data head and common CKD datasets ---
    # These names MUST match the lowercased, stripped column names in your DataFrame
    numerical_features_ckd = [
        'age', 'blood pressure', 'specific gravity', 'albumin', 'sugar',
        'blood glucose random', 'blood urea', 'serum creatinine', 'sodium',
        'potassium', 'hemoglobin', 'packed cell volume',
        'white blood cell count', 'red blood cell count' # Assuming this is numerical
    ]
    categorical_features_ckd = [
        # 'red blood cells', # Removed this as 'red blood cell count' is likely the numerical one.
                            # If you have a separate categorical 'red blood cells' column, re-add it here.
        'pus cell', 'pus cell clumps', 'bacteria',
        'hypertension', 'diabetes mellitus', 'coronary artery disease',
        'appetite', 'pedal edema', 'anemia'
    ]

    # --- CRITICAL FIX: Convert ALL relevant columns to numeric type, coercing errors to NaN ---
    # Iterate through all columns that *should* be numerical and convert them.
    # This is a more robust way to catch any lingering non-numeric strings.
    for col in numerical_features_ckd:
        if col in df_ckd.columns:
            # Check for non-numeric values *before* conversion for debugging
            non_numeric_vals = df_ckd[col][pd.to_numeric(df_ckd[col], errors='coerce').isna() & df_ckd[col].notna()]
            if not non_numeric_vals.empty:
                print(f"DEBUG: Column '{col}' contains non-numeric values before conversion: {non_numeric_vals.unique()}")
            df_ckd[col] = pd.to_numeric(df_ckd[col], errors='coerce')
        else:
            print(f"Warning: Numerical feature '{col}' not found in CKD dataset after lowercasing. Skipping conversion.")

    # --- CRITICAL FIX: Strip whitespace and lowercase values from categorical columns ---
    # This helps OneHotEncoder avoid issues with ' yes' vs 'yes'
    for col in categorical_features_ckd:
        if col in df_ckd.columns and df_ckd[col].dtype == 'object':
            df_ckd[col] = df_ckd[col].str.strip().str.lower()
            # Check for unique values after cleaning for debugging
            print(f"DEBUG: Categorical column '{col}' unique values after cleaning: {df_ckd[col].unique()}")
        else:
            print(f"Warning: Categorical feature '{col}' not found or not object type in CKD dataset. Skipping stripping/lowercasing.")

    # --- DEBUGGING: Check for any remaining '\t?' in the entire DataFrame ---
    # This is a sanity check to see if the problematic string is still anywhere
    if df_ckd.applymap(lambda x: isinstance(x, str) and '\t?' in x).any().any():
        print("CRITICAL DEBUG: '\t?' still found in DataFrame AFTER all cleaning steps. Investigate data source.")
        # You might want to print the specific rows/columns here for deeper analysis
        # For example: print(df_ckd[df_ckd.applymap(lambda x: isinstance(x, str) and '\t?' in x).any(axis=1)])

    # Select features for X_ckd *after* cleaning and type conversion
    all_ckd_features = numerical_features_ckd + categorical_features_ckd
    # Filter to only include features actually present in the DataFrame
    # This also ensures we only pass the columns we intend to preprocess to the pipeline
    X_ckd = df_ckd[[f for f in all_ckd_features if f in df_ckd.columns]]

    # --- DEBUGGING: Print dtypes and missing values right before pipeline fit ---
    print("\nCKD DataFrame dtypes AFTER all cleaning and feature selection (X_ckd):")
    print(X_ckd.dtypes)
    print("\nMissing values in X_ckd BEFORE pipeline fit:")
    print(X_ckd.isnull().sum()[X_ckd.isnull().sum() > 0])


    preprocessor_ckd = ColumnTransformer(
        transformers=[
            ('num', Pipeline(steps=[
                ('imputer', SimpleImputer(strategy='mean')), # Impute NaNs in numerical features
                ('scaler', StandardScaler())
            ]), numerical_features_ckd), # Use numerical_features_ckd directly
            ('cat', Pipeline(steps=[
                ('imputer', SimpleImputer(strategy='most_frequent')), # Impute NaNs in categorical features
                ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
            ]), categorical_features_ckd) # Use categorical_features_ckd directly
        ],
        remainder='passthrough' # Keep other columns if any, though not expected to have '\t?' now
    )

    model_ckd_pipeline = Pipeline([
        ('preprocessor', preprocessor_ckd),
        ('classifier', RandomForestClassifier(random_state=42, n_estimators=100))
    ])

    X_train_ckd, X_test_ckd, y_train_ckd, y_test_ckd = train_test_split(
        X_ckd, y_ckd, test_size=0.2, random_state=42, stratify=y_ckd
    )

    print("\nTraining CKD model pipeline...")
    model_ckd_pipeline.fit(X_train_ckd, y_train_ckd)
    print("CKD model trained successfully! 🎉")

    accuracy_ckd = model_ckd_pipeline.score(X_test_ckd, y_test_ckd)
    print(f"CKD Model Accuracy: {accuracy_ckd:.4f}")

    ckd_model_path = os.path.join(SAVE_MODEL_DIR, 'ckd_model.pkl')
    with open(ckd_model_path, 'wb') as f:
        # Save the entire pipeline, not just the classifier, for consistent preprocessing during inference
        pickle.dump(model_ckd_pipeline, f)
    print(f"✅ CKD model pipeline saved to {ckd_model_path}")

    # Display output feature names
    if hasattr(preprocessor_ckd, 'get_feature_names_out'):
        feature_names_out_ckd = preprocessor_ckd.get_feature_names_out()
        print(f"CKD Preprocessor Output Features ({len(feature_names_out_ckd)}):\n{feature_names_out_ckd.tolist()}")

except FileNotFoundError:
    print(f"⚠️ Warning: CKD dataset not found at {CKD_DATA_PATH}. Skipping CKD model training.")
except Exception as e:
    print(f"❌ Error training CKD model: {e}")
    import traceback
    traceback.print_exc()


# --- 5. Liver Disease Model Training ---
print("\n--- Training Liver Disease Model ---")
LIVER_DISEASE_DATA_PATH = os.path.join(DATA_DIR, 'liver_disease_dataset.xlsx')

try:
    df_liver = pd.read_excel(LIVER_DISEASE_DATA_PATH)

    print("Liver Disease dataset loaded successfully.")
    print("Liver Disease Data Head:\n", df_liver.head())

    # Clean column names
    df_liver.columns = df_liver.columns.str.strip().str.lower().str.replace(' ', '_')

    if 'dataset' not in df_liver.columns:
        raise ValueError("Target column 'Dataset' not found in liver dataset.")

    # Convert target: 1 = Disease, 2 = No Disease → map 1→1, 2→0
    df_liver['target'] = df_liver['dataset'].apply(lambda x: 1 if x == 1 else 0)
    df_liver.drop(columns=['dataset'], inplace=True)

    y_liver = df_liver['target']
    X_liver = df_liver.drop(columns=['target'])

    # Identify numerical and categorical features
    numerical_features_liver = [
        'age', 'total_bilirubin', 'direct_bilirubin', 'alkaline_phosphotase',
        'alamine_aminotransferase', 'aspartate_aminotransferase',
        'total_protiens', 'albumin', 'albumin_and_globulin_ratio'
    ]
    categorical_features_liver = ['gender'] if 'gender' in X_liver.columns else []

    # Clean categorical values
    for col in categorical_features_liver:
        if col in X_liver.columns:
            X_liver[col] = X_liver[col].str.strip().str.lower()

    # Convert numeric columns
    for col in numerical_features_liver:
        if col in X_liver.columns:
            X_liver[col] = pd.to_numeric(X_liver[col], errors='coerce')

    print("Liver Data Types:\n", X_liver.dtypes)
    print("\nMissing values in Liver dataset:\n", X_liver.isnull().sum()[X_liver.isnull().sum() > 0])

    preprocessor_liver = ColumnTransformer(
        transformers=[
            ('num', Pipeline([
                ('imputer', SimpleImputer(strategy='mean')),
                ('scaler', StandardScaler())
            ]), numerical_features_liver),
            ('cat', Pipeline([
                ('imputer', SimpleImputer(strategy='most_frequent')),
                ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
            ]), categorical_features_liver)
        ],
        remainder='drop'
    )

    model_liver_pipeline = Pipeline([
        ('preprocessor', preprocessor_liver),
        ('classifier', RandomForestClassifier(random_state=42, n_estimators=100))
    ])

    X_train_liver, X_test_liver, y_train_liver, y_test_liver = train_test_split(
        X_liver, y_liver, test_size=0.2, random_state=42, stratify=y_liver
    )

    model_liver_pipeline.fit(X_train_liver, y_train_liver)
    print("✅ Liver disease model trained successfully!")

    acc_liver = model_liver_pipeline.score(X_test_liver, y_test_liver)
    print(f"Liver Disease Model Accuracy: {acc_liver:.4f}")

    liver_model_path = os.path.join(SAVE_MODEL_DIR, 'liver_disease_model.pkl')
    with open(liver_model_path, 'wb') as f:
        pickle.dump(model_liver_pipeline, f)
    print(f"✅ Liver disease model saved to {liver_model_path}")

    # Optional: print feature names after preprocessing
    if hasattr(preprocessor_liver, 'get_feature_names_out'):
        feature_names_liver = preprocessor_liver.get_feature_names_out()
        print(f"Liver Preprocessor Output Features ({len(feature_names_liver)}):\n{feature_names_liver.tolist()}")

except FileNotFoundError:
    print(f"⚠️ Warning: Liver dataset not found at {LIVER_DISEASE_DATA_PATH}. Skipping Liver model training.")
except Exception as e:
    print(f"❌ Error training Liver Disease model: {e}")
    import traceback
    traceback.print_exc()

# --- 6. Thyroid Disease Model Training ---
print("\n--- Training Thyroid Disease Model ---")
THYROID_DATA_PATH = os.path.join(DATA_DIR, 'thyroid_dataset.xlsx')

try:
    df_thyroid = pd.read_excel(THYROID_DATA_PATH)
    print("Thyroid dataset loaded successfully.")
    print("Thyroid Data Head:\n", df_thyroid.head())

    # Clean column names
    df_thyroid.columns = df_thyroid.columns.str.strip().str.lower().str.replace(' ', '_')

    if 'target' not in df_thyroid.columns:
        raise ValueError("Target column 'target' not found in thyroid dataset.")

    print("Original target value counts:\n", df_thyroid['target'].value_counts())

    # 🟢 Keep only 'S' (sick) and '-' (healthy/negative)
    df_thyroid = df_thyroid[df_thyroid['target'].isin(['S', '-'])]

    # 🔁 Convert to binary classification: S=1, -=0
    df_thyroid['target'] = df_thyroid['target'].apply(lambda x: 1 if x == 'S' else 0)

    print("Filtered target value counts:\n", df_thyroid['target'].value_counts())

    if df_thyroid['target'].nunique() < 2:
        raise ValueError("Not enough distinct classes in target column after filtering.")

    # Separate features and target
    y_thyroid = df_thyroid['target']
    X_thyroid = df_thyroid.drop(columns=['target', 'patient_id'], errors='ignore')

    # Define numerical and categorical features
    numerical_features_thyroid = ['age', 'tsh', 't3', 'tt4', 't4u', 'fti', 'tbg']
    categorical_features_thyroid = [col for col in X_thyroid.columns if col not in numerical_features_thyroid]

    # Clean and preprocess categorical features
    for col in categorical_features_thyroid:
        if col in X_thyroid.columns:
            X_thyroid[col] = X_thyroid[col].astype(str).str.strip().str.lower()

    # Ensure numeric columns are converted properly
    for col in numerical_features_thyroid:
        if col in X_thyroid.columns:
            X_thyroid[col] = pd.to_numeric(X_thyroid[col], errors='coerce')

    print("Thyroid Data Types:\n", X_thyroid.dtypes)
    print("\nMissing values in Thyroid dataset:\n", X_thyroid.isnull().sum()[X_thyroid.isnull().sum() > 0])

    # Preprocessing pipeline
    preprocessor_thyroid = ColumnTransformer(
        transformers=[
            ('num', Pipeline([
                ('imputer', SimpleImputer(strategy='mean')),
                ('scaler', StandardScaler())
            ]), numerical_features_thyroid),
            ('cat', Pipeline([
                ('imputer', SimpleImputer(strategy='most_frequent')),
                ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
            ]), categorical_features_thyroid)
        ],
        remainder='drop'
    )

    model_thyroid_pipeline = Pipeline([
        ('preprocessor', preprocessor_thyroid),
        ('classifier', RandomForestClassifier(random_state=42, n_estimators=100))
    ])

    # Split and train
    X_train_thyroid, X_test_thyroid, y_train_thyroid, y_test_thyroid = train_test_split(
        X_thyroid, y_thyroid, test_size=0.2, random_state=42, stratify=y_thyroid
    )

    model_thyroid_pipeline.fit(X_train_thyroid, y_train_thyroid)
    print("✅ Thyroid disease model trained successfully!")

    # Evaluate
    acc_thyroid = model_thyroid_pipeline.score(X_test_thyroid, y_test_thyroid)
    print(f"Thyroid Disease Model Accuracy: {acc_thyroid:.4f}")

    # Save model
    thyroid_model_path = os.path.join(SAVE_MODEL_DIR, 'thyroid_model.pkl')
    with open(thyroid_model_path, 'wb') as f:
        pickle.dump(model_thyroid_pipeline, f)
    print(f"✅ Thyroid disease model saved to {thyroid_model_path}")

    # Optional: print preprocessed feature names
    if hasattr(preprocessor_thyroid, 'get_feature_names_out'):
        feature_names_thyroid = preprocessor_thyroid.get_feature_names_out()
        print(f"Thyroid Preprocessor Output Features ({len(feature_names_thyroid)}):\n{feature_names_thyroid.tolist()}")

except FileNotFoundError:
    print(f"⚠️ Warning: Thyroid dataset not found at {THYROID_DATA_PATH}. Skipping Thyroid model training.")
except Exception as e:
    print(f"❌ Error training Thyroid Disease model: {e}")
    import traceback
    traceback.print_exc()

# --- 7. Cancer Disease Model Training ---
print("\n--- Training Cancer Disease Model ---")

CANCER_DATA_PATH = os.path.join(DATA_DIR, 'cancer_disease.xlsx')

try:
    df = pd.read_excel(CANCER_DATA_PATH)
    print("Dataset loaded successfully.")

    # Normalize column names (lowercase + underscores)
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')

    # Create binary target: 'diagnosis' -> is_cancer
    df['is_cancer'] = df['diagnosis'].apply(
        lambda x: 0 if str(x).strip().lower() in ['none', 'no', 'not performed'] else 1
    )

    # Drop original diagnosis and cancer_type columns
    X = df.drop(columns=['diagnosis', 'cancertype'])
    y = df['is_cancer']

    # Define numerical features exactly matching your dataset
    numerical_features = [
        'age',
        'bmi',
        'physicalactivity_hoursperweek',
        'genomicmarker_1',
        'genomicmarker_2',
        'tumorsize_mm',
        'bloodtest_markera',
        'bloodtest_markerb',
    ]

    # Define categorical features exactly matching your dataset
    categorical_features = [
        'gender',
        'familyhistorycancer',
        'smokingstatus',
        'alcoholconsumption',
        'biopsyresult',
        'chronicdisease_hypertension',
        'chronicdisease_diabetes',
        'symptoms_fatigue',
        'symptoms_unexplainedweightloss',
    ]

    # Filter features by presence in data (just in case)
    numerical_features = [f for f in numerical_features if f in X.columns]
    categorical_features = [f for f in categorical_features if f in X.columns]

    # Convert numerical features to numeric (coerce errors)
    for col in numerical_features:
        X[col] = pd.to_numeric(X[col], errors='coerce')

    # Clean categorical features: lowercase and strip whitespace
    for col in categorical_features:
        X[col] = X[col].astype(str).str.strip().str.lower()

    print(f"Numerical features: {numerical_features}")
    print(f"Categorical features: {categorical_features}")

    # Check missing values
    print("\nMissing values in features:\n", X.isnull().sum())

    # Preprocessing pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', Pipeline([
                ('imputer', SimpleImputer(strategy='mean')),
                ('scaler', StandardScaler())
            ]), numerical_features),
            ('cat', Pipeline([
                ('imputer', SimpleImputer(strategy='most_frequent')),
                ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
            ]), categorical_features)
        ],
        remainder='drop'
    )

    # Create pipeline with RandomForest classifier
    model_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(random_state=42, n_estimators=100))
    ])

    # Split data (stratify on target)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("\nTraining model...")
    model_pipeline.fit(X_train, y_train)
    print("✅ Model trained successfully!")

    # Evaluate
    accuracy = model_pipeline.score(X_test, y_test)
    print(f"Model Accuracy on test set: {accuracy:.4f}")

    # Save the pipeline
    model_file = os.path.join(SAVE_MODEL_DIR, 'cancer_model.pkl')
    with open(model_file, 'wb') as f:
        pickle.dump(model_pipeline, f)
    print(f"✅ Model saved at: {model_file}")

    # Save scaler separately (optional)
    scaler = model_pipeline.named_steps['preprocessor'].named_transformers_['num'].named_steps['scaler']
    scaler_file = os.path.join(SAVE_MODEL_DIR, 'cancer_scaler.pkl')
    joblib.dump(scaler, scaler_file)
    print(f"✅ Scaler saved at: {scaler_file}")

except FileNotFoundError:
    print(f"⚠️ Dataset file not found at {CANCER_DATA_PATH}. Skipping training.")
except Exception as e:
    print(f"❌ Error during training: {e}")
    traceback.print_exc()