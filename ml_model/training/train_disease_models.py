import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
# Import XGBoost for higher accuracy
from xgboost import XGBClassifier
import pickle
import os
import traceback
import joblib

# Define the project root dynamically
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, '..', '..'))

# Adjust paths as needed based on your file structure
DATA_DIR = os.path.join(PROJECT_ROOT, 'ml_model', 'training', 'data', 'disease_data')
SAVE_MODEL_DIR = os.path.join(PROJECT_ROOT, 'ml_model', 'saved-model')

os.makedirs(SAVE_MODEL_DIR, exist_ok=True)

print(f"Project Root: {PROJECT_ROOT}")
print(f"Data Directory: {DATA_DIR}")
print(f"Save Model Directory: {SAVE_MODEL_DIR}")

# --- Helper Function for Training and Tuning ---
def train_and_save_model(name, pipeline, X, y, save_dir, use_tuning=False, tuning_params=None):
    """Trains a model (with optional tuning) and saves it."""
    print(f"\n--- Training {name} Model ---")
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    if use_tuning and tuning_params:
        print(f"Starting Randomized Search for {name}...")
        
        # Use RandomizedSearchCV for efficient tuning
        search = RandomizedSearchCV(
            estimator=pipeline,
            param_distributions=tuning_params,
            n_iter=50, # Number of parameter settings that are sampled (adjust as needed)
            cv=5,      # 5-fold cross-validation
            scoring='accuracy',
            verbose=1,
            random_state=42,
            n_jobs=-1
        )
        search.fit(X_train, y_train)
        model = search.best_estimator_
        print(f"Best parameters for {name}: {search.best_params_}")
    else:
        pipeline.fit(X_train, y_train)
        model = pipeline

    accuracy = model.score(X_test, y_test)
    print(f"✅ {name} Model Accuracy: {accuracy:.4f}")

    # Save the entire pipeline/best estimator
    model_path = os.path.join(save_dir, f'{name.lower().replace(" ", "_")}_model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    print(f"✅ {name} model saved to {model_path}")
    
    # Optionally save the preprocessor/scaler separately if needed for simple models
    if 'preprocessor' in model.named_steps:
        preprocessor_path = os.path.join(save_dir, f'{name.lower().replace(" ", "_")}_preprocessor.pkl')
        with open(preprocessor_path, 'wb') as f:
            pickle.dump(model.named_steps['preprocessor'], f)
        print(f"✅ {name} preprocessor saved to {preprocessor_path}")

    return accuracy

# --- XGBoost Tuning Parameters (General) ---
XGB_PARAM_GRID = {
    'classifier__n_estimators': [100, 200, 300, 500],
    'classifier__max_depth': [3, 5, 7, 9],
    'classifier__learning_rate': [0.01, 0.05, 0.1, 0.2],
    'classifier__subsample': [0.6, 0.8, 1.0],
    'classifier__colsample_bytree': [0.6, 0.8, 1.0],
    'classifier__gamma': [0, 0.5, 1, 5],
    'classifier__reg_alpha': [0, 0.1, 0.5, 1]
}

# -------------------------------------------------------------
# --- 1. Diabetes Model Training (Simple XGBoost) ---
# -------------------------------------------------------------
DIABETES_DATA_PATH = os.path.join(DATA_DIR, 'diabetes_dataset.xlsx')

try:
    df_diabetes = pd.read_excel(DIABETES_DATA_PATH)
    X_diabetes = df_diabetes.drop('Outcome', axis=1)
    y_diabetes = df_diabetes['Outcome']

    # Diabetes data is clean and all numerical, just use StandardScaler
    preprocessor_diabetes = StandardScaler()
    
    model_diabetes_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor_diabetes),
        ('classifier', XGBClassifier(random_state=42, use_label_encoder=False, eval_metric='logloss'))
    ])
    
    train_and_save_model("Diabetes", model_diabetes_pipeline, X_diabetes, y_diabetes, SAVE_MODEL_DIR)

except FileNotFoundError:
    print(f"⚠️ Warning: Diabetes dataset not found. Skipping Diabetes model training.")
except Exception as e:
    print(f"❌ Error training Diabetes model: {e}")
    traceback.print_exc()

# -------------------------------------------------------------
# --- 2. Heart Disease Model Training (Simple XGBoost) ---
# -------------------------------------------------------------
HEART_DISEASE_DATA_PATH = os.path.join(DATA_DIR, 'heart_disease_dataset.xlsx')

try:
    df_heart = pd.read_excel(HEART_DISEASE_DATA_PATH)
    df_heart.columns = df_heart.columns.str.lower()
    X_heart = df_heart.drop('target', axis=1)
    y_heart = df_heart['target']

    # Heart disease is also mostly clean and numerical
    preprocessor_heart = StandardScaler()

    model_heart_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor_heart),
        ('classifier', XGBClassifier(random_state=42, use_label_encoder=False, eval_metric='logloss'))
    ])
    
    train_and_save_model("Heart Disease", model_heart_pipeline, X_heart, y_heart, SAVE_MODEL_DIR)

except FileNotFoundError:
    print(f"⚠️ Warning: Heart Disease dataset not found. Skipping Heart Disease model training.")
except Exception as e:
    print(f"❌ Error training Heart Disease model: {e}")
    traceback.print_exc()

# -------------------------------------------------------------
# --- 3. Hypertension Model Training (Tuned XGBoost) ---
# -------------------------------------------------------------
HYPERTENSION_DATA_PATH = os.path.join(DATA_DIR, 'hypertension_dataset.xlsx')

try:
    df_hypertension = pd.read_excel(HYPERTENSION_DATA_PATH)
    
    # Data Cleaning and Target conversion (as in original script)
    df_hypertension.rename(columns={
        'Age_yrs': 'Age_yrs', 'Gender': 'Gender', 'Education_Level': 'Education_Level',
        'Occupation': 'Occupation', 'Physical Activity': 'Physical_Activity', 
        'Smoking Habits': 'Smoking_Habits', 'BMI': 'BMI', 
        'Hypertension (Y/N)': 'Hypertension'
    }, inplace=True)
    df_hypertension['Hypertension'] = df_hypertension['Hypertension'].apply(lambda x: 1 if str(x).strip().upper() == 'Y' else 0)
    
    X_hypertension = df_hypertension.drop('Hypertension', axis=1)
    y_hypertension = df_hypertension['Hypertension']

    numerical_features_hypertension = ['Age_yrs', 'BMI']
    categorical_features_hypertension = ['Gender', 'Education_Level', 'Occupation', 'Physical_Activity', 'Smoking_Habits']

    preprocessor_hypertension = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_features_hypertension),
            # Use drop='first' for better performance with linear components in tree methods
            ('cat', OneHotEncoder(handle_unknown='ignore', drop='first', sparse_output=False), categorical_features_hypertension)
        ],
        remainder='drop'
    )

    model_hypertension_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor_hypertension),
        ('classifier', XGBClassifier(random_state=42, use_label_encoder=False, eval_metric='logloss'))
    ])
    
    # Train with Hyperparameter Tuning
    train_and_save_model(
        "Hypertension", 
        model_hypertension_pipeline, 
        X_hypertension, 
        y_hypertension, 
        SAVE_MODEL_DIR, 
        use_tuning=True, 
        tuning_params=XGB_PARAM_GRID
    )

except FileNotFoundError:
    print(f"⚠️ Warning: Hypertension dataset not found. Skipping Hypertension model training.")
except Exception as e:
    print(f"❌ Error training Hypertension model: {e}")
    traceback.print_exc()

# -------------------------------------------------------------
# --- 4. CKD Model Training (Tuned XGBoost) ---
# -------------------------------------------------------------
CKD_DATA_PATH = os.path.join(DATA_DIR, 'kidney_disease.xlsx')

try:
    missing_values = ['\t?', '?', ' ', '', '\t', 'na', 'n/a', 'NA', '--', '-', '\t\t']
    df_ckd = pd.read_excel(CKD_DATA_PATH, na_values=missing_values)
    df_ckd.columns = df_ckd.columns.str.strip().str.replace('"', '').str.lower()
    
    if 'patient id' in df_ckd.columns:
        df_ckd = df_ckd.drop(columns=['patient id'])

    target_col = 'classification'
    y_ckd = df_ckd[target_col].apply(lambda x: 1 if str(x).lower().strip() in ['ckd', 'ckd detected'] else 0)

    numerical_features_ckd = [
        'age', 'blood pressure', 'specific gravity', 'albumin', 'sugar',
        'blood glucose random', 'blood urea', 'serum creatinine', 'sodium',
        'potassium', 'hemoglobin', 'packed cell volume',
        'white blood cell count', 'red blood cell count'
    ]
    categorical_features_ckd = [
        'pus cell', 'pus cell clumps', 'bacteria',
        'hypertension', 'diabetes mellitus', 'coronary artery disease',
        'appetite', 'pedal edema', 'anemia'
    ]
    
    # --- Data Type Conversion and Cleaning ---
    for col in numerical_features_ckd:
        if col in df_ckd.columns:
            df_ckd[col] = pd.to_numeric(df_ckd[col], errors='coerce')

    for col in categorical_features_ckd:
        if col in df_ckd.columns and df_ckd[col].dtype == 'object':
            df_ckd[col] = df_ckd[col].str.strip().str.lower()
        
    all_ckd_features = numerical_features_ckd + categorical_features_ckd
    X_ckd = df_ckd[[f for f in all_ckd_features if f in df_ckd.columns]]

    preprocessor_ckd = ColumnTransformer(
        transformers=[
            ('num', Pipeline(steps=[
                ('imputer', SimpleImputer(strategy='mean')),
                ('scaler', StandardScaler())
            ]), [f for f in numerical_features_ckd if f in X_ckd.columns]),
            ('cat', Pipeline(steps=[
                ('imputer', SimpleImputer(strategy='most_frequent')),
                ('onehot', OneHotEncoder(handle_unknown='ignore', drop='first', sparse_output=False))
            ]), [f for f in categorical_features_ckd if f in X_ckd.columns])
        ],
        remainder='drop'
    )

    model_ckd_pipeline = Pipeline([
        ('preprocessor', preprocessor_ckd),
        ('classifier', XGBClassifier(random_state=42, use_label_encoder=False, eval_metric='logloss'))
    ])

    # Train with Hyperparameter Tuning
    train_and_save_model(
        "CKD", 
        model_ckd_pipeline, 
        X_ckd, 
        y_ckd, 
        SAVE_MODEL_DIR, 
        use_tuning=True, 
        tuning_params=XGB_PARAM_GRID
    )

except FileNotFoundError:
    print(f"⚠️ Warning: CKD dataset not found. Skipping CKD model training.")
except Exception as e:
    print(f"❌ Error training CKD model: {e}")
    traceback.print_exc()

# -------------------------------------------------------------
# --- 5. Liver Disease Model Training (Tuned XGBoost) ---
# -------------------------------------------------------------
LIVER_DISEASE_DATA_PATH = os.path.join(DATA_DIR, 'liver_disease_dataset.xlsx')

try:
    df_liver = pd.read_excel(LIVER_DISEASE_DATA_PATH)
    df_liver.columns = df_liver.columns.str.strip().str.lower().str.replace(' ', '_')

    df_liver['target'] = df_liver['dataset'].apply(lambda x: 1 if x == 1 else 0)
    df_liver.drop(columns=['dataset'], inplace=True)

    y_liver = df_liver['target']
    X_liver = df_liver.drop(columns=['target'])

    numerical_features_liver = [
        'age', 'total_bilirubin', 'direct_bilirubin', 'alkaline_phosphotase',
        'alamine_aminotransferase', 'aspartate_aminotransferase',
        'total_protiens', 'albumin', 'albumin_and_globulin_ratio'
    ]
    categorical_features_liver = ['gender'] if 'gender' in X_liver.columns else []

    # Clean and convert data types
    for col in categorical_features_liver:
        if col in X_liver.columns:
            X_liver[col] = X_liver[col].str.strip().str.lower()
    for col in numerical_features_liver:
        if col in X_liver.columns:
            X_liver[col] = pd.to_numeric(X_liver[col], errors='coerce')

    preprocessor_liver = ColumnTransformer(
        transformers=[
            ('num', Pipeline([
                ('imputer', SimpleImputer(strategy='mean')),
                ('scaler', StandardScaler())
            ]), numerical_features_liver),
            ('cat', Pipeline([
                ('imputer', SimpleImputer(strategy='most_frequent')),
                ('onehot', OneHotEncoder(handle_unknown='ignore', drop='first', sparse_output=False))
            ]), categorical_features_liver)
        ],
        remainder='drop'
    )

    model_liver_pipeline = Pipeline([
        ('preprocessor', preprocessor_liver),
        ('classifier', XGBClassifier(random_state=42, use_label_encoder=False, eval_metric='logloss'))
    ])

    # Train with Hyperparameter Tuning
    train_and_save_model(
        "Liver Disease", 
        model_liver_pipeline, 
        X_liver, 
        y_liver, 
        SAVE_MODEL_DIR, 
        use_tuning=True, 
        tuning_params=XGB_PARAM_GRID
    )

except FileNotFoundError:
    print(f"⚠️ Warning: Liver dataset not found. Skipping Liver model training.")
except Exception as e:
    print(f"❌ Error training Liver Disease model: {e}")
    traceback.print_exc()

# -------------------------------------------------------------
# --- 6. Thyroid Disease Model Training (Tuned XGBoost) ---
# -------------------------------------------------------------
THYROID_DATA_PATH = os.path.join(DATA_DIR, 'thyroid_dataset.xlsx')

try:
    df_thyroid = pd.read_excel(THYROID_DATA_PATH)
    df_thyroid.columns = df_thyroid.columns.str.strip().str.lower().str.replace(' ', '_')

    if 'target' not in df_thyroid.columns:
        raise ValueError("Target column 'target' not found in thyroid dataset.")

    # Filter and convert target to binary: S=1, -=0
    df_thyroid = df_thyroid[df_thyroid['target'].isin(['S', '-'])]
    df_thyroid['target'] = df_thyroid['target'].apply(lambda x: 1 if x == 'S' else 0)

    y_thyroid = df_thyroid['target']
    X_thyroid = df_thyroid.drop(columns=['target', 'patient_id'], errors='ignore')

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

    # Preprocessing pipeline
    preprocessor_thyroid = ColumnTransformer(
        transformers=[
            ('num', Pipeline([
                ('imputer', SimpleImputer(strategy='mean')),
                ('scaler', StandardScaler())
            ]), numerical_features_thyroid),
            ('cat', Pipeline([
                ('imputer', SimpleImputer(strategy='most_frequent')),
                ('onehot', OneHotEncoder(handle_unknown='ignore', drop='first', sparse_output=False))
            ]), categorical_features_thyroid)
        ],
        remainder='drop'
    )

    model_thyroid_pipeline = Pipeline([
        ('preprocessor', preprocessor_thyroid),
        ('classifier', XGBClassifier(random_state=42, use_label_encoder=False, eval_metric='logloss'))
    ])

    # Train with Hyperparameter Tuning
    train_and_save_model(
        "Thyroid Disease", 
        model_thyroid_pipeline, 
        X_thyroid, 
        y_thyroid, 
        SAVE_MODEL_DIR, 
        use_tuning=True, 
        tuning_params=XGB_PARAM_GRID
    )

except FileNotFoundError:
    print(f"⚠️ Warning: Thyroid dataset not found. Skipping Thyroid model training.")
except Exception as e:
    print(f"❌ Error training Thyroid Disease model: {e}")
    traceback.print_exc()

# -------------------------------------------------------------
# --- 7. Cancer Disease Model Training (Tuned XGBoost) ---
# -------------------------------------------------------------
CANCER_DATA_PATH = os.path.join(DATA_DIR, 'cancer_disease.xlsx')

try:
    df = pd.read_excel(CANCER_DATA_PATH)
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')

    # Target: 'diagnosis' -> is_cancer
    df['is_cancer'] = df['diagnosis'].apply(
        lambda x: 0 if str(x).strip().lower() in ['none', 'no', 'not performed'] else 1
    )

    X = df.drop(columns=['diagnosis', 'cancertype', 'is_cancer'])
    y = df['is_cancer']

    numerical_features = [
        'age', 'bmi', 'physicalactivity_hoursperweek', 'genomicmarker_1',
        'genomicmarker_2', 'tumorsize_mm', 'bloodtest_markera', 'bloodtest_markerb',
    ]
    categorical_features = [
        'gender', 'familyhistorycancer', 'smokingstatus', 'alcoholconsumption',
        'biopsyresult', 'chronicdisease_hypertension', 'chronicdisease_diabetes',
        'symptoms_fatigue', 'symptoms_unexplainedweightloss',
    ]

    numerical_features = [f for f in numerical_features if f in X.columns]
    categorical_features = [f for f in categorical_features if f in X.columns]

    # Convert numerical and clean categorical
    for col in numerical_features:
        X[col] = pd.to_numeric(X[col], errors='coerce')
    for col in categorical_features:
        X[col] = X[col].astype(str).str.strip().str.lower()

    # Preprocessing pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', Pipeline([
                ('imputer', SimpleImputer(strategy='mean')),
                ('scaler', StandardScaler())
            ]), numerical_features),
            ('cat', Pipeline([
                ('imputer', SimpleImputer(strategy='most_frequent')),
                ('onehot', OneHotEncoder(handle_unknown='ignore', drop='first', sparse_output=False))
            ]), categorical_features)
        ],
        remainder='drop'
    )

    # Create pipeline with XGBoost classifier
    model_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', XGBClassifier(random_state=42, use_label_encoder=False, eval_metric='logloss'))
    ])

    # Train with Hyperparameter Tuning
    train_and_save_model(
        "Cancer Disease", 
        model_pipeline, 
        X, 
        y, 
        SAVE_MODEL_DIR, 
        use_tuning=True, 
        tuning_params=XGB_PARAM_GRID
    )

except FileNotFoundError:
    print(f"⚠️ Dataset file not found at {CANCER_DATA_PATH}. Skipping training.")
except Exception as e:
    print(f"❌ Error during training: {e}")
    traceback.print_exc()

print("\n--- All Model Training Complete ---")