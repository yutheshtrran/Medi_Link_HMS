import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import axios

// --- Configuration for your Flask Backend ---
const BACKEND_URL = 'http://localhost:5005'; 

// Helper function to determine the arrow indicator based on risk level
const getArrowIndicator = (riskLevel) => {
  switch (riskLevel) {
    case 'Low':
      return '🟢🙂'; // Green circle happy face for low risk
    case 'Medium':
      return '🟡😐'; // Yellow circle neutral face for medium risk
    case 'High':
      return '🟠😟'; // Orange circle worried face for high risk
    case 'Very High':
      return '🔴😱'; // Red circle screaming face for very high high risk
    default:
      return '';
  }
};

// Helper function to provide general messages (backend will provide specific reason)
const getPredictionMessage = (diseaseName, risk) => {
  const baseMessage = `Based on your inputs, your hypothetical risk for ${diseaseName} is: `;

  switch (risk) {
    case 'Low':
      return `${baseMessage}Low. Continue to maintain a healthy lifestyle and regular check-ups.`;
    case 'Medium':
      return `${baseMessage}Medium. It would be beneficial to discuss these factors with a healthcare professional for further guidance.`;
    case 'High':
      return `${baseMessage}High. It is strongly recommended to consult a healthcare professional immediately for a comprehensive assessment and advice.`;
    case 'Very High':
      return `${baseMessage}Very High. Please seek urgent medical attention and professional advice regarding these findings.`;
    default:
      return "";
  }
};

// Configuration for diseases
const diseases = [
  {
    id: 'diabetes',
    name: 'Diabetes Risk Predictor',
    inputs: [
      { id: 'gender', label: 'Gender', type: 'select', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }] },
      { id: 'pregnancies', label: 'Number of Pregnancies', type: 'number', placeholder: 'e.g., 1', min: '0', max: '17' },
      { id: 'glucose', label: 'Glucose (mg/dL)', type: 'number', placeholder: 'e.g., 120', min: '0', max: '200' },
      { id: 'bloodPressure', label: 'Blood Pressure (mmHg)', type: 'number', placeholder: 'e.g., 70', min: '0', max: '122' },
      { id: 'skinThickness', label: 'Skin Thickness (mm)', type: 'number', placeholder: 'e.g., 30', min: '0', max: '99' },
      { id: 'insulin', label: 'Insulin (mu/UML)', type: 'number', placeholder: 'e.g., 150', min: '0', max: '846' },
      { id: 'bmi', label: 'BMI (Body Mass Index)', type: 'number', placeholder: 'e.g., 25.5', step: '0.1', min: '0', max: '67.1' },
      { id: 'diabetesPedigreeFunction', label: 'Diabetes Pedigree Function', type: 'number', placeholder: 'e.g., 0.5', step: '0.001', min: '0.078', max: '2.42' },
      { id: 'age', label: 'Age', type: 'number', placeholder: 'e.g., 30', min: '21', max: '81' },
    ],
    supportsImage: true, 
    imagePromptExample: 'Relevant medical report or lab results',
  },
  {
    id: 'heartDisease',
    name: 'Heart Disease Risk Predictor',
    inputs: [
      { id: 'age', label: 'Age', type: 'number', placeholder: 'e.g., 45', min: '0', max: '120', description: 'Your age in years.' },
      { id: 'sex', label: 'Sex', type: 'select', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }], description: 'Biological sex.' },
      {
        id: 'Chest Pain (Numbers)',
        label: 'Chest Pain Type',
        type: 'select',
        options: [
          { value: '0', label: 'Typical Angina' },
          { value: '1', label: 'Atypical Angina' },
          { value: '2', label: 'Non-Anginal Pain' },
          { value: '3', label: 'Asymptomatic' }
        ],
        description: 'Type of chest pain experienced (0: Typical Angina, 1: Atypical Angina, 2: Non-Anginal Pain, 3: Asymptomatic).'
      },
      { id: 'Trestbps (Resting Blood Pressure)', label: 'Resting Blood Pressure (mmHg)', type: 'number', placeholder: 'e.g., 120', min: '70', max: '200', description: 'Your resting systolic blood pressure.' },
      { id: 'Cholesterol', label: 'Cholesterol (mg/dL)', type: 'number', placeholder: 'e.g., 200', min: '50', max: '600', description: 'Serum cholesterol in mg/dL.' },
      {
        id: 'Fasting Blood Sugar',
        label: 'Fasting Blood Sugar > 120 mg/dL?',
        type: 'select',
        options: [
          { value: '0', label: 'No (<= 120 mg/dL)' },
          { value: '1', label: 'Yes (> 120 mg/dL)' }
        ],
        description: 'Is your fasting blood sugar greater than 120 mg/dL?'
      },
      {
        id: 'Resting Electrocardiographic Results',
        label: 'Resting ECG Results',
        type: 'select',
        options: [
          { value: '0', label: 'Normal' },
          { value: '1', label: 'ST-T Wave Abnormality' },
          { value: '2', label: 'Left Ventricular Hypertrophy' }
        ],
        description: 'Results from your resting ECG (0: Normal, 1: ST-T Wave Abnormality, 2: Left Ventricular Hypertrophy).'
      },
      { id: 'Maximum Heart Rate Achieved', label: 'Maximum Heart Rate Achieved', type: 'number', placeholder: 'e.g., 150', min: '60', max: '220', description: 'The highest heart rate reached during exercise.' },
      {
        id: 'Exercise Induced Angina',
        label: 'Exercise Induced Angina?',
        type: 'select',
        options: [
          { value: '0', label: 'No' },
          { value: '1', label: 'Yes' }
        ],
        description: 'Do you experience chest pain during exercise?'
      },
      { id: 'ST Depression Induced by Exercise Relative to Rest', label: 'ST Depression (Exercise vs Rest)', type: 'number', placeholder: 'e.g., 1.0', step: '0.1', min: '0', max: '6.7', description: 'ST depression value from exercise ECG.' },
      {
        id: 'Slope of the Peak Exercise ST Segment',
        label: 'Slope of Peak Exercise ST Segment',
        type: 'select',
        options: [
          { value: '0', label: 'Upsloping' },
          { value: '1', label: 'Flat' },
          { value: '2', label: 'Downsloping' }
        ],
        description: 'The slope of the ST segment during peak exercise (0: Upsloping, 1: Flat, 2: Downsloping).'
      },
      { id: 'Number of Major Vessels Colored by Flouroscopy', label: 'Number of Major Vessels (0-3)', type: 'number', placeholder: 'e.g., 0-3', min: '0', max: '3', description: 'Number of major vessels (0-3) colored by fluoroscopy.' },
      {
        id: 'Thallium Stress Test Result',
        label: 'Thallium Stress Test Result',
        type: 'select',
        options: [
          { value: '1', label: 'Normal' },
          { value: '2', label: 'Fixed Defect' },
          { value: '3', label: 'Reversible Defect' }
        ],
        description: 'Result of the thallium stress test (1: Normal, 2: Fixed Defect, 3: Reversible Defect).'
      },
    ],
    supportsImage: true, 
    imagePromptExample: 'ECG or other cardiac report',
  },
  {
    id: 'hypertension',
    name: 'Hypertension Risk Predictor',
    inputs: [
      { id: 'Age_yrs', label: 'Age (Years)', type: 'number', placeholder: 'e.g., 45', min: '0', max: '120', description: 'Your age in years.' },
      { id: 'Gender', label: 'Gender', type: 'select', options: [
          { value: '0', label: 'Male' },
          { value: '1', label: 'Female' }
        ], description: 'Biological gender (0 for Male, 1 for Female).' },
      { id: 'Education_Level', label: 'Education Level', type: 'select', options: [
          { value: '0', label: 'Primary' },
          { value: '1', label: 'Secondary' },
          { value: '2', label: 'Graduate' },
          { value: '3', label: 'Postgraduate' }
        ], description: 'Highest level of education achieved (0-3).' },
      { id: 'Occupation', label: 'Occupation', type: 'select', options: [
          { value: '0', label: 'Office Worker' },
          { value: '1', label: 'Manual Labor' },
          { value: '2', label: 'Healthcare' },
          { value: '3', label: 'Student' },
          { value: '4', label: 'Other' }
        ], description: 'Your current occupation (0-4).' },
      { id: 'Physical_Activity', label: 'Physical Activity', type: 'select', options: [
          { value: '0', label: 'Low' },
          { value: '1', label: 'Moderate' },
          { value: '2', label: 'High' }
        ], description: 'Your typical physical activity level (0-2).' },
      { id: 'Smoking_Habits', label: 'Smoking Habits', type: 'select', options: [
          { value: '0', label: 'Non-Smoker' },
          { value: '1', label: 'Former Smoker' },
          { value: '2', label: 'Smoker' }
        ], description: 'Your current smoking habits (0-2).' },
      { id: 'BMI', label: 'BMI (Body Mass Index)', type: 'number', placeholder: 'e.g., 27.5', step: '0.1', min: '10', max: '60', description: 'Your Body Mass Index.' },
    ],
    supportsImage: true, 
    imagePromptExample: 'Relevant medical report or lab results',
  },
  // --- NEW: CKD (Chronic Kidney Disease) Risk Predictor ---
  {
    id: 'ckd',
    name: 'Chronic Kidney Disease Risk Predictor',
    inputs: [
      { id: 'age', label: 'Age', type: 'number', placeholder: 'e.g., 48', min: '0', max: '100' },
      { id: 'Blood Pressure', label: 'Blood Pressure (mmHg)', type: 'number', placeholder: 'e.g., 80', min: '0', max: '300' },
      { id: 'Specific Gravity', label: 'Specific Gravity', type: 'number', placeholder: 'e.g., 1.020', step: '0.001', min: '1.000', max: '1.030' },
      // --- MODIFIED: Albumin to dropdown ---
      {
        id: 'Albumin',
        label: 'Albumin',
        type: 'select',
        options: [
          { value: '0', label: 'Normal (0)' },
          { value: '1', label: 'Trace (1)' },
          { value: '2', label: 'Moderate (2)' },
          { value: '3', label: 'High (3)' },
          { value: '4', label: 'Very High (4)' },
          { value: '5', label: 'Severe (5)' },
        ],
        description: 'Albumin level in urine (0-5).'
      },
      // --- MODIFIED: Sugar to dropdown ---
      {
        id: 'Sugar',
        label: 'Sugar',
        type: 'select',
        options: [
          { value: '0', label: 'Normal (0)' },
          { value: '1', label: 'Trace (1)' },
          { value: '2', label: 'Moderate (2)' },
          { value: '3', label: 'High (3)' },
          { value: '4', label: 'Very High (4)' },
          { value: '5', label: 'Severe (5)' },
        ],
        description: 'Sugar level in urine (0-5).'
      },
      { id: 'Blood Glucose Random', label: 'Blood Glucose Random (mgs/dl)', type: 'number', placeholder: 'e.g., 120', min: '0', max: '500' },
      { id: 'Blood Urea', label: 'Blood Urea (mgs/dl)', type: 'number', placeholder: 'e.g., 40', min: '0', max: '400' },
      { id: 'Serum Creatinine', label: 'Serum Creatinine (mgs/dl)', type: 'number', placeholder: 'e.g., 1.2', step: '0.1', min: '0', max: '80' },
      { id: 'Sodium', label: 'Sodium (mEq/L)', type: 'number', placeholder: 'e.g., 140', min: '0', max: '200' },
      { id: 'Potassium', label: 'Potassium (mEq/L)', type: 'number', placeholder: 'e.g., 4.0', step: '0.1', min: '0', max: '50' },
      { id: 'Hemoglobin', label: 'Hemoglobin (gms)', type: 'number', placeholder: 'e.g., 13.0', step: '0.1', min: '0', max: '20' },
      { id: 'Packed Cell Volume', label: 'Packed Cell Volume', type: 'number', placeholder: 'e.g., 40', min: '0', max: '60' },
      { id: 'White Blood Cell Count', label: 'White Blood Cell Count (cells/cumm)', type: 'number', placeholder: 'e.g., 7000', min: '0', max: '30000' },
      { id: 'Red Blood Cell Count', label: 'Red Blood Cell Count (millions/cmm)', type: 'number', placeholder: 'e.g., 5.0', step: '0.1', min: '0', max: '10' },
      { id: 'Pus Cell', label: 'Pus Cell', type: 'select', options: [{ value: 'normal', label: 'Normal' }, { value: 'abnormal', label: 'Abnormal' }] },
      { id: 'Pus Cell clumps', label: 'Pus Cell Clumps', type: 'select', options: [{ value: 'notpresent', label: 'Not Present' }, { value: 'present', label: 'Present' }] },
      { id: 'Bacteria', label: 'Bacteria', type: 'select', options: [{ value: 'notpresent', label: 'Not Present' }, { value: 'present', label: 'Present' }] },
      { id: 'Hypertension', label: 'Hypertension', type: 'select', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
      { id: 'Diabetes Mellitus', label: 'Diabetes Mellitus', type: 'select', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
      { id: 'Coronary Artery Disease', label: 'Coronary Artery Disease', type: 'select', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
      { id: 'Appetite', label: 'Appetite', type: 'select', options: [{ value: 'good', label: 'Good' }, { value: 'poor', label: 'Poor' }] },
      { id: 'Pedal Edema', label: 'Pedal Edema', type: 'select', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
      { id: 'Anemia', label: 'Anemia', type: 'select', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
    ],
    supportsImage: true, 
    imagePromptExample: 'Relevant medical report or lab results',
  },
  // --- NEW: Liver Disease Risk Predictor ---
  {
    id: 'liverDisease',
    name: 'Liver Disease Risk Predictor',
    inputs: [
      { id: 'Age', label: 'Age (Years)', type: 'number', placeholder: 'e.g., 45', min: '0', max: '100' },
      { id: 'Gender', label: 'Gender', type: 'select', options: [{ value: '0', label: 'Male' }, { value: '1', label: 'Female' }] },
      { id: 'Total_Bilirubin', label: 'Total Bilirubin (mg/dL)', type: 'number', placeholder: 'e.g., 1.2', step: '0.1', min: '0', max: '100' },
      { id: 'Direct_Bilirubin', label: 'Direct Bilirubin (mg/dL)', type: 'number', placeholder: 'e.g., 0.3', step: '0.1', min: '0', max: '50' },
      { id: 'Alkaline_Phosphotase', label: 'Alkaline Phosphatase (IU/L)', type: 'number', placeholder: 'e.g., 100', min: '0', max: '2000' },
      { id: 'Alamine_Aminotransferase', label: 'Alamine Aminotransferase (IU/L)', type: 'number', placeholder: 'e.g., 50', min: '0', max: '2000' },
      { id: 'Aspartate_Aminotransferase', label: 'Aspartate Aminotransferase (IU/L)', type: 'number', placeholder: 'e.g., 40', min: '0', max: '2000' },
      { id: 'Total_Protiens', label: 'Total Proteins (gms/dL)', type: 'number', placeholder: 'e.g., 7.0', step: '0.1', min: '0', max: '15' },
      { id: 'Albumin', label: 'Albumin (gms/dL)', type: 'number', placeholder: 'e.g., 3.5', step: '0.1', min: '0', max: '10' },
      { id: 'Albumin_and_Globulin_Ratio', label: 'Albumin and Globulin Ratio', type: 'number', placeholder: 'e.g., 1.0', step: '0.01', min: '0', max: '5' },
    ],
    supportsImage: true, 
    imagePromptExample: 'Relevant medical report or lab results',
  },
  // --- NEW: Thyroid Disease Risk Predictor ---
  {
    id: 'thyroidDisease',
    name: 'Thyroid Disease Risk Predictor',
    inputs: [
      { id: 'age', label: 'Age (Years)', type: 'number', placeholder: 'e.g., 45', min: '0', max: '100' },
      { id: 'sex', label: 'Sex', type: 'select', options: [{ value: '0', label: 'Male' }, { value: '1', label: 'Female' }] },
      { id: 'on_thyroxine', label: 'On Thyroxine?', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
      { id: 'query_on_thyroxine', label: 'Query on Thyroxine?', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
      { id: 'on_antithyroid_meds', label: 'On Antithyroid Meds?', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
      { id: 'sick', label: 'Sick?', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
      { id: 'pregnant', label: 'Pregnant?', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
      { id: 'thyroid_surgery', label: 'Thyroid Surgery?', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
      { id: 'I131_treatment', label: 'I131 Treatment?', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
      { id: 'query_hypothyroid', label: 'Query Hypothyroid?', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
      { id: 'query_hyperthyroid', label: 'Query Hyperthyroid?', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
      { id: 'lithium', label: 'Lithium?', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
      { id: 'goitre', label: 'Goitre?', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
      { id: 'tumor', label: 'Tumor?', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
      { id: 'hypopituitary', label: 'Hypopituitary?', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
      { id: 'psych', label: 'Psych?', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
      { id: 'TSH_measured', label: 'TSH Measured?', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }], description: 'Indicates if TSH value is available (1) or not (0).' },
      { id: 'TSH', label: 'TSH (mIU/L)', type: 'number', placeholder: 'e.g., 1.5', step: '0.01', min: '0', max: '500' },
      { id: 'T3_measured', label: 'T3 Measured?', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }], description: 'Indicates if T3 value is available (1) or not (0).' },
      { id: 'T3', label: 'T3 (ng/dL)', type: 'number', placeholder: 'e.g., 1.8', step: '0.1', min: '0', max: '10' },
      { id: 'TT4_measured', label: 'TT4 Measured?', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }], description: 'Indicates if TT4 value is available (1) or not (0).' },
      { id: 'TT4', label: 'TT4 (ug/dL)', type: 'number', placeholder: 'e.g., 100', step: '0.1', min: '0', max: '300' },
      { id: 'T4U_measured', label: 'T4U (ratio)', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }], description: 'Indicates if T4U value is available (1) or not (0).' },
      { id: 'T4U', label: 'T4U (ratio)', type: 'number', placeholder: 'e.g., 0.9', step: '0.01', min: '0', max: '2' },
      { id: 'FTI_measured', label: 'FTI Measured?', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }], description: 'Indicates if FTI value is available (1) or not (0).' },
      { id: 'FTI', label: 'FTI (index)', type: 'number', placeholder: 'e.g., 100', step: '0.1', min: '0', max: '500' },
      { id: 'TBG_measured', label: 'TBG Measured?', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }], description: 'Indicates if TBG value is available (1) or not (0).' },
      { id: 'TBG', label: 'TBG (ug/dL)', type: 'number', placeholder: 'e.g., 20', step: '0.1', min: '0', max: '100' },
    ],
    supportsImage: true, 
    imagePromptExample: 'Relevant medical report or lab results',
  },
  // --- NEW: Cancer Risk Predictor ---
  {
  id: 'cancerDisease',
  name: 'Cancer Risk Predictor',
  inputs: [
    { id: 'Age', label: 'Age (Years)', type: 'number', placeholder: 'e.g., 50', min: '0', max: '120' },
    { id: 'Gender', label: 'Gender', type: 'select', options: [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }] },
    { id: 'FamilyHistoryCancer', label: 'Family History of Cancer', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    {
      id: 'SmokingStatus',
      label: 'Smoking Status',
      type: 'select',
      options: [
        { value: 'Never Smoked', label: 'Never Smoked' },
        { value: 'Former Smoker', label: 'Former Smoker' },
        { value: 'Current Smoker', label: 'Current Smoker' },
      ]
    },
    {
      id: 'AlcoholConsumption',
      label: 'Alcohol Consumption',
      type: 'select',
      options: [
        { value: 'None', label: 'None' },
        { value: 'Moderate', label: 'Moderate' },
        { value: 'Heavy', label: 'Heavy' }
      ]
    },
    { id: 'BMI', label: 'BMI (Body Mass Index)', type: 'number', placeholder: 'e.g., 28.0', step: '0.1', min: '10', max: '60' },
    { id: 'PhysicalActivity_HoursPerWeek', label: 'Physical Activity (Hours/Week)', type: 'number', placeholder: 'e.g., 3.0', step: '0.1', min: '0', max: '50' },
    { id: 'ChronicDisease_Hypertension', label: 'Chronic Disease: Hypertension', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { id: 'ChronicDisease_Diabetes', label: 'Chronic Disease: Diabetes', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { id: 'GenomicMarker_1', label: 'Genomic Marker 1', type: 'number', placeholder: 'e.g., 0', min: '0', max: '1' },
    { id: 'GenomicMarker_2', label: 'Genomic Marker 2', type: 'number', placeholder: 'e.g., 0', min: '0', max: '1' },
    { id: 'TumorSize_mm', label: 'Tumor Size (mm)', type: 'number', placeholder: 'e.g., 10.0', step: '0.1', min: '0', max: '200' },
    {
      id: 'BiopsyResult',
      label: 'Biopsy Result',
      type: 'select',
      options: [
        { value: 'Benign', label: 'Benign' },
        { value: 'Malignant', label: 'Malignant' },
        { value: 'Not Performed', label: 'Not Performed' },
        { value: 'Atypical', label: 'Atypical' }
      ]
    },
    { id: 'BloodTest_MarkerA', label: 'Blood Test Marker A', type: 'number', placeholder: 'e.g., 125.8', step: '0.1', min: '0', max: '1000' },
    { id: 'BloodTest_MarkerB', label: 'Blood Test Marker B', type: 'number', placeholder: 'e.g., 1.5', step: '0.1', min: '0', max: '10' },
    { id: 'Symptoms_Fatigue', label: 'Symptoms: Fatigue', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
    { id: 'Symptoms_UnexplainedWeightLoss', label: 'Symptoms: Unexplained Weight Loss', type: 'select', options: [{ value: '0', label: 'No' }, { value: '1', label: 'Yes' }] },
  ],
  supportsImage: true,
  imagePromptExample: 'CT/MRI scan, X-ray, or pathology report',
}
];

// Main React App Component
function DiseasePredictor() {
  const navigate = useNavigate();

  // State to manage the currently selected disease
  const [selectedDiseaseId, setSelectedDiseaseId] = useState(diseases[0].id); // Default to Diabetes
  // Find the full disease object based on the selected ID
  const selectedDisease = diseases.find(d => d.id === selectedDiseaseId);

  const [inputValues, setInputValues] = useState({});
  const [formPredictionResult, setFormPredictionResult] = useState(null);
  const [isFormPredicting, setIsFormPredicting] = useState(false);

  const [imageFile, setImageFile] = useState(null); // Stores the actual File object
  const [imagePreviewUrl, setImagePreviewUrl] = useState(''); // Stores the Data URL for preview
  const [isImagePredicting, setIsImagePredicting] = useState(false);
  const [imagePredictionResult, setImagePredictionResult] = useState(null);

  // New state for Patient Name
  const [patientName, setPatientName] = useState('');

  // New states for the summary modal
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryModalContent, setSummaryModalContent] = useState('');

  // New state for a global loading overlay message
  const [globalLoadingMessage, setGlobalLoadingMessage] = useState('');
  const isLoading = isFormPredicting || isImagePredicting; // Combined loading state

  useEffect(() => {
    const initialInputs = {};
    selectedDisease.inputs.forEach(input => {
      // Set default for select inputs to their first option value
      initialInputs[input.id] = input.type === 'select' ? input.options[0].value : '';
    });
    setInputValues(initialInputs);
    setFormPredictionResult(null);
    setIsFormPredicting(false);
    setImageFile(null); // Reset image file
    setImagePreviewUrl(''); // Reset image preview
    setIsImagePredicting(false);
    setImagePredictionResult(null);
    setGlobalLoadingMessage(''); // Clear loading message on disease change
    // Do not reset patientName here, it should persist across disease selections
  }, [selectedDiseaseId, selectedDisease.inputs]); // Dependency array updated to react to selectedDiseaseId

  const handleChange = (e) => {
    const { id, value } = e.target;
    setInputValues(prev => ({ ...prev, [id]: value }));
  };

  const handlePatientNameChange = (e) => {
    setPatientName(e.target.value);
    // Clear results when patient name changes, as the message will be different
    setFormPredictionResult(null);
    setImagePredictionResult(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file); // Store the actual File object
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result); // Store Data URL for preview
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreviewUrl('');
    }
    setImagePredictionResult(null); // Clear previous image prediction results
  };

  const analyzeImageWithBackend = async () => { // No longer takes base64ImageData, uses imageFile from state
    if (!imageFile) {
      setImagePredictionResult({
        stage: 'Error',
        message: 'Please select a file to upload.',
        indicator: '⚠️',
      });
      return;
    }

    setIsImagePredicting(true);
    setGlobalLoadingMessage('Uploading and analyzing report with AI...');
    setImagePredictionResult(null);

    try {
      const formData = new FormData();
      formData.append("file", imageFile); // Append the File object with key "file"
      formData.append("disease_id", selectedDisease.id); // Send the currently selected disease ID

      // The endpoint is now /predict/upload as per user's request
      const apiUrl = `${BACKEND_URL}/predict/upload`; 

      const response = await axios.post(apiUrl, formData, {
        headers: {
          // Axios automatically sets Content-Type to multipart/form-data when FormData is used
          // 'Content-Type': 'multipart/form-data' // No need to set manually
        }
      });

      // --- CRITICAL DEBUGGING STEP: Log the raw response data ---
      console.log("Frontend received raw response.data:", response.data);
      // --- END DEBUGGING STEP ---

      // Assuming the backend response structure for image/report prediction
      // It should return 'risk_level' and 'reason'
      if (response.data && response.data.risk_level && response.data.reason) {
        const result = {
          stage: response.data.risk_level,
          message: response.data.reason, // Use the reason directly from backend
          indicator: getArrowIndicator(response.data.risk_level),
        };
        setImagePredictionResult(result);
        setSummaryModalContent(formatSummaryModalContent('image', result));
        setShowSummaryModal(true); // Open the modal
      } else if (response.data && response.data.error) { // Handle backend errors more gracefully
        setImagePredictionResult({
          stage: 'Error',
          message: `Backend Error: ${response.data.error}`,
          indicator: '❌',
        });
      }
      else {
        setImagePredictionResult({
          stage: 'Error',
          message: 'Backend response was empty or malformed (missing risk_level, reason, or error).',
          indicator: '❌',
        });
      }
    } catch (error) {
      console.error("Error analyzing report with backend ML model:", error);
      setFormPredictionResult({ // Changed from setImagePredictionResult to setFormPredictionResult for general error display
        stage: 'Error',
        message: `Failed to analyze report: ${error.response?.data?.error || error.response?.data?.message || error.message}. Please ensure your Flask backend is running on ${BACKEND_URL} and configured correctly for file uploads at /predict/upload.`,
        indicator: '❌',
      });
    } finally {
      setIsImagePredicting(false);
      setGlobalLoadingMessage(''); // Clear loading message
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormPredictionResult(null);
    setIsFormPredicting(true);
    setGlobalLoadingMessage('Analyzing form data with AI...');

    try {
      let response;
      let apiUrl;
      let riskLevel;
      let reason;

      if (selectedDisease.id === 'diabetes') {
        const diabetesFormData = {
          Pregnancies: parseFloat(inputValues.pregnancies),
          Glucose: parseFloat(inputValues.glucose),
          BloodPressure: parseFloat(inputValues.bloodPressure),
          SkinThickness: parseFloat(inputValues.skinThickness),
          Insulin: parseFloat(inputValues.insulin),
          BMI: parseFloat(inputValues.bmi),
          DiabetesPedigreeFunction: parseFloat(inputValues.diabetesPedigreeFunction),
          Age: parseFloat(inputValues.age),
        };
        apiUrl = `${BACKEND_URL}/predict-diabetes`;
        response = await axios.post(apiUrl, diabetesFormData, {
          headers: { 'Content-Type': 'application/json' },
        });

        const predictionOutcome = response.data.prediction;
        if (predictionOutcome === 1) {
          riskLevel = 'High';
          reason = 'Based on the model, you are predicted to be Diabetic. It is strongly recommended to consult a healthcare professional immediately for a comprehensive assessment and advice.';
        } else if (predictionOutcome === 0) {
          riskLevel = 'Low';
          reason = 'Based on the model, you are predicted to be Not Diabetic. Continue to maintain a healthy lifestyle and regular check-ups.';
        } else {
          riskLevel = 'Cannot Determine';
          reason = 'The model returned an unexpected prediction outcome.';
        }

      } else if (selectedDisease.id === 'heartDisease') {
        // Prepare formData for Heart Disease matching the exact keys from your working example
        const heartDiseaseFormData = {
          age: parseFloat(inputValues.age),
          sex: inputValues.sex === 'male' ? 0 : 1, // Convert 'male'/'female' to 0/1
          "Chest Pain (Numbers)": parseFloat(inputValues['Chest Pain (Numbers)']),
          "Trestbps (Resting Blood Pressure)": parseFloat(inputValues['Trestbps (Resting Blood Pressure)']),
          "Cholesterol": parseFloat(inputValues.Cholesterol),
          "Fasting Blood Sugar": parseInt(inputValues['Fasting Blood Sugar']), // Convert '0'/'1' string to int
          "Resting Electrocardiographic Results": parseInt(inputValues['Resting Electrocardiographic Results']), // Now a select, convert to int
          "Maximum Heart Rate Achieved": parseFloat(inputValues['Maximum Heart Rate Achieved']),
          "Exercise Induced Angina": parseInt(inputValues['Exercise Induced Angina']), // Convert '0'/'1' string to int
          "ST Depression Induced by Exercise Relative to Rest": parseFloat(inputValues['ST Depression Induced by Exercise Relative to Rest']),
          "Slope of the Peak Exercise ST Segment": parseInt(inputValues['Slope of the Peak Exercise ST Segment']), // Now a select, convert to int
          "Number of Major Vessels Colored by Flouroscopy": parseFloat(inputValues['Number of Major Vessels Colored by Flouroscopy']),
          "Thallium Stress Test Result": parseInt(inputValues['Thallium Stress Test Result']), // Now a select, convert to int
        };

        apiUrl = `${BACKEND_URL}/predict-heart-disease`; // Use the specific endpoint from your working example
        response = await axios.post(apiUrl, heartDiseaseFormData, {
          headers: { 'Content-Type': 'application/json' },
        });

        // Map 0/1 prediction from the user's working backend example for heart disease
        const predictionOutcome = response.data.prediction;
        if (predictionOutcome === 1) {
          riskLevel = 'High';
          reason = 'Based on the model, there is a predicted risk of Heart Disease. It is strongly recommended to consult a healthcare professional immediately for a comprehensive assessment and advice.';
        } else if (predictionOutcome === 0) {
          riskLevel = 'Low';
          reason = 'Based on the model, no heart disease is currently detected. Continue to maintain a healthy lifestyle and regular check-ups.';
        } else {
          riskLevel = 'Cannot Determine';
          reason = 'The model returned an unexpected prediction outcome.';
        }

      } else if (selectedDisease.id === 'hypertension') {
        // Prepare formData for Hypertension with numerical values
        const hypertensionFormData = {
          "Age_yrs": parseFloat(inputValues.Age_yrs),
          "Gender": parseInt(inputValues.Gender), // Convert to int
          "Education_Level": parseInt(inputValues.Education_Level), // Convert to int
          "Occupation": parseInt(inputValues.Occupation), // Convert to int
          "Physical_Activity": parseInt(inputValues.Physical_Activity), // Convert to int
          "Smoking_Habits": parseInt(inputValues.Smoking_Habits), // Convert to int
          "BMI": parseFloat(inputValues.BMI),
        };

        apiUrl = `${BACKEND_URL}/predict-hypertension`;
        response = await axios.post(
          apiUrl,
          hypertensionFormData,
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );

        // Assuming backend for hypertension will return 'prediction' (0 or 1)
        const predictionOutcome = response.data.prediction;
        if (predictionOutcome === 1) {
          riskLevel = 'High';
          reason = 'Based on the model, there is a predicted risk of Hypertension. It is strongly recommended to consult a healthcare professional immediately for a comprehensive assessment and advice.';
        } else if (predictionOutcome === 0) {
          riskLevel = 'Low';
          reason = 'Based on the model, no hypertension is currently detected. Continue to maintain a healthy lifestyle and regular check-ups.';
        } else {
          riskLevel = 'Cannot Determine';
          reason = 'The model returned an unexpected prediction outcome.';
        }
      } else if (selectedDisease.id === 'ckd') {
        // Prepare formData for CKD, matching the exact keys from your backend's expected input
        const ckdFormData = {
          "age": parseFloat(inputValues.age),
          "Blood Pressure": parseFloat(inputValues['Blood Pressure']),
          "Specific Gravity": parseFloat(inputValues['Specific Gravity']),
          "Albumin": parseFloat(inputValues.Albumin),
          "Sugar": parseFloat(inputValues.Sugar),
          "Blood Glucose Random": parseFloat(inputValues['Blood Glucose Random']),
          "Blood Urea": parseFloat(inputValues['Blood Urea']),
          "Serum Creatinine": parseFloat(inputValues['Serum Creatinine']),
          "Sodium": parseFloat(inputValues.Sodium),
          "Potassium": parseFloat(inputValues.Potassium),
          "Hemoglobin": parseFloat(inputValues.Hemoglobin),
          "Packed Cell Volume": parseFloat(inputValues['Packed Cell Volume']),
          "White Blood Cell Count": parseFloat(inputValues['White Blood Cell Count']),
          "Red Blood Cell Count": parseFloat(inputValues['Red Blood Cell Count']),
          "Pus Cell": inputValues['Pus Cell'],
          "Pus Cell clumps": inputValues['Pus Cell clumps'],
          "Bacteria": inputValues.Bacteria,
          "Hypertension": inputValues.Hypertension,
          "Diabetes Mellitus": inputValues['Diabetes Mellitus'],
          "Coronary Artery Disease": inputValues['Coronary Artery Disease'],
          "Appetite": inputValues.Appetite,
          "Pedal Edema": inputValues['Pedal Edema'],
          "Anemia": inputValues.Anemia,
        };

        apiUrl = `${BACKEND_URL}/predict-ckd`;
        response = await axios.post(apiUrl, ckdFormData, {
          headers: { 'Content-Type': 'application/json' },
        });

        const predictionOutcome = response.data.prediction;
        if (predictionOutcome === 1) {
          riskLevel = 'High';
          reason = 'Based on the model, there is a predicted risk of Chronic Kidney Disease. Immediate medical consultation is strongly advised for further evaluation and management.';
        } else if (predictionOutcome === 0) {
          riskLevel = 'Low';
          reason = 'Based on the model, no Chronic Kidney Disease is currently detected. Continue to maintain a healthy lifestyle and regular check-ups.';
        } else {
          riskLevel = 'Cannot Determine';
          reason = 'The model returned an unexpected prediction outcome.';
        }
      } else if (selectedDisease.id === 'liverDisease') {
        // Prepare formData for Liver Disease
        const liverDiseaseFormData = {
          Age: parseFloat(inputValues.Age),
          Gender: parseInt(inputValues.Gender), // Convert to int (0 for Male, 1 for Female)
          Total_Bilirubin: parseFloat(inputValues.Total_Bilirubin),
          Direct_Bilirubin: parseFloat(inputValues.Direct_Bilirubin),
          Alkaline_Phosphotase: parseFloat(inputValues.Alkaline_Phosphotase),
          Alamine_Aminotransferase: parseFloat(inputValues.Alamine_Aminotransferase),
          Aspartate_Aminotransferase: parseFloat(inputValues.Aspartate_Aminotransferase),
          Total_Protiens: parseFloat(inputValues.Total_Protiens),
          Albumin: parseFloat(inputValues.Albumin),
          Albumin_and_Globulin_Ratio: parseFloat(inputValues.Albumin_and_Globulin_Ratio),
        };

        apiUrl = `${BACKEND_URL}/predict-liver-disease`; // New endpoint for liver disease
        response = await axios.post(apiUrl, liverDiseaseFormData, {
          headers: { 'Content-Type': 'application/json' },
        });

        const predictionOutcome = response.data.prediction;
        if (predictionOutcome === 1) {
          riskLevel = 'High';
          reason = 'Based on the model, there is a predicted risk of Liver Disease. It is strongly recommended to consult a healthcare professional immediately for a comprehensive assessment and advice.';
        } else if (predictionOutcome === 0) {
          riskLevel = 'Low';
          reason = 'Based on the model, no Liver Disease is currently detected. Continue to maintain a healthy lifestyle and regular check-ups.';
        } else {
          riskLevel = 'Cannot Determine';
          reason = 'The model returned an unexpected prediction outcome.';
        }
      } else if (selectedDisease.id === 'thyroidDisease') {
        // Prepare formData for Thyroid Disease
        const thyroidDiseaseFormData = {
          age: parseFloat(inputValues.age),
          sex: parseInt(inputValues.sex),
          on_thyroxine: parseInt(inputValues.on_thyroxine),
          query_on_thyroxine: parseInt(inputValues.query_on_thyroxine),
          on_antithyroid_meds: parseInt(inputValues.on_antithyroid_meds),
          sick: parseInt(inputValues.sick),
          pregnant: parseInt(inputValues.pregnant),
          thyroid_surgery: parseInt(inputValues.thyroid_surgery),
          I131_treatment: parseInt(inputValues.I131_treatment),
          query_hypothyroid: parseInt(inputValues.query_hypothyroid),
          query_hyperthyroid: parseInt(inputValues.query_hyperthyroid),
          lithium: parseInt(inputValues.lithium),
          goitre: parseInt(inputValues.goitre),
          tumor: parseInt(inputValues.tumor),
          hypopituitary: parseInt(inputValues.hypopituitary),
          psych: parseInt(inputValues.psych),
          TSH_measured: parseInt(inputValues.TSH_measured),
          TSH: inputValues.TSH_measured === '1' ? parseFloat(inputValues.TSH) : -1, // Use -1 or a suitable default for unmeasured
          T3_measured: parseInt(inputValues.T3_measured),
          T3: inputValues.T3_measured === '1' ? parseFloat(inputValues.T3) : -1,
          TT4_measured: parseInt(inputValues.TT4_measured),
          TT4: inputValues.TT4_measured === '1' ? parseFloat(inputValues.TT4) : -1,
          T4U_measured: parseInt(inputValues.T4U_measured),
          T4U: inputValues.T4U_measured === '1' ? parseFloat(inputValues.T4U) : -1,
          FTI_measured: parseInt(inputValues.FTI_measured),
          FTI: inputValues.FTI_measured === '1' ? parseFloat(inputValues.FTI) : -1,
          TBG_measured: parseInt(inputValues.TBG_measured),
          TBG: inputValues.TBG_measured === '1' ? parseFloat(inputValues.TBG) : -1,
        };

        apiUrl = `${BACKEND_URL}/predict-thyroid-disease`; // New endpoint for thyroid disease
        response = await axios.post(apiUrl, thyroidDiseaseFormData, {
          headers: { 'Content-Type': 'application/json' },
        });

        const predictionOutcome = response.data.prediction; // Assuming 0 for healthy, 1 for hypothyroid, 2 for hyperthyroid, etc.
        if (predictionOutcome === 0) {
          riskLevel = 'Low';
          reason = 'Based on the model, no thyroid disease is currently detected. Continue to maintain a healthy lifestyle and regular check-ups.';
        } else if (predictionOutcome === 1) { // Example: Assuming 1 for Hypothyroid
          riskLevel = 'High';
          reason = 'Based on the model, there is a predicted risk of Hypothyroid. It is strongly recommended to consult a healthcare professional immediately for a comprehensive assessment and advice.';
        } else if (predictionOutcome === 2) { // Example: Assuming 2 for Hyperthyroid
          riskLevel = 'High';
          reason = 'Based on the model, there is a predicted risk of Hyperthyroid. It is strongly recommended to consult a healthcare professional immediately for a comprehensive assessment and advice.';
        }
        else {
          riskLevel = 'Cannot Determine';
          reason = 'The model returned an unexpected prediction outcome.';
        }
      } else if (selectedDisease.id === 'cancerDisease') {
        // --- CRITICAL: Constructing the payload for backend/tabular_routes/cancer.py ---
        const cancerFormData = {
          // Fields must match backend/tabular_routes/cancer.py's expected_features EXACTLY in name and case
          Age: parseFloat(inputValues.Age),
          Gender: inputValues.Gender, // String: "Male", "Female"
          SmokingStatus: inputValues.SmokingStatus, // String: "Never", "Former", "Current"
          AlcoholConsumption: inputValues.AlcoholConsumption, // String: "None", "Moderate", "Heavy"
          BMI: parseFloat(inputValues.BMI),
          PhysicalActivity_HoursPerWeek: parseFloat(inputValues.PhysicalActivity_HoursPerWeek),
          HereditaryRisk: inputValues.HereditaryRisk, // String: "0" or "1"
          PreviousMalignancy: inputValues.PreviousMalignancy, // String: "0" or "1"
          FamilyHistoryCancer: inputValues.FamilyHistoryCancer, // String: "0" or "1"
          ChronicDisease_Hypertension: inputValues.ChronicDisease_Hypertension, // String: "0" or "1"
          ChronicDisease_Diabetes: inputValues.ChronicDisease_Diabetes, // String: "0" or "1"
          GenomicMarker_1: parseFloat(inputValues.GenomicMarker_1),
          GenomicMarker_2: parseFloat(inputValues.GenomicMarker_2),
          TumorSize_mm: parseFloat(inputValues.TumorSize_mm),
          TumorMarkerLevel: parseFloat(inputValues.TumorMarkerLevel),
          BiopsyResult: inputValues.BiopsyResult, // String: "Benign", "Malignant", etc.
          BloodTest_MarkerA: parseFloat(inputValues.BloodTest_MarkerA), 
          BloodTest_MarkerB: parseFloat(inputValues.BloodTest_MarkerB), 
          Symptoms_Fatigue: inputValues.Symptoms_Fatigue, // String: "0" or "1"
          Symptoms_UnexplainedWeightLoss: inputValues.Symptoms_UnexplainedWeightLoss, // String: "0" or "1"
        };
        
        console.log("Payload being sent for Cancer:", cancerFormData); // Debugging line

        apiUrl = `${BACKEND_URL}/predict-cancer`; 
        response = await axios.post(apiUrl, cancerFormData, {
          headers: { 'Content-Type': 'application/json' },
        });

        riskLevel = response.data.risk_level;
        reason = response.data.reason;
        
      }
      else {
        throw new Error(`Prediction for disease_id '${selectedDisease.id}' not yet implemented in frontend.`);
      }

      const result = {
        stage: riskLevel,
        message: reason, 
        indicator: getArrowIndicator(riskLevel),
      };
      setFormPredictionResult(result);
      setSummaryModalContent(formatSummaryModalContent('form', result));
      setShowSummaryModal(true); 

    } catch (error) {
      console.error("Error analyzing form data with backend ML model:", error);
      setFormPredictionResult({
        stage: 'Error',
        message: `Failed to analyze form data with ML model: ${error.response?.data?.error || error.response?.data?.message || error.message}. Please ensure your Flask backend is running on ${BACKEND_URL} and configured correctly for form predictions.`,
        indicator: '❌',
      });
    } finally {
      setIsFormPredicting(false);
      setGlobalLoadingMessage(''); // Clear loading message
    }
  };

  // Function to format the final message displayed below the form/upload
  const formatResultMessage = (resultType, result) => {
    const namePart = patientName ? `Dear ${patientName},\n\n` : '';
    const source = resultType === 'form' ? 'your provided information' : 'the uploaded report';
    const message = result.message; 

    return `${namePart}Based on ${source}, your hypothetical risk for ${selectedDisease.name.replace(' Risk Predictor', '')} is: ${result.stage}.\n\n${message}`;
  };

  // Function to format the content for the summary modal
  const formatSummaryModalContent = (resultType, result) => {
    let content = '';
    const diseaseName = selectedDisease.name.replace(' Risk Predictor', '');

    if (patientName) {
      content += `Dear ${patientName},\n\n`;
    }

    content += `Here is a summary of the analysis for ${diseaseName}:\n\n`;

    if (resultType === 'form') {
      content += `--- Your Input Values ---\n`;
      selectedDisease.inputs.forEach(input => {
        const value = inputValues[input.id];
        // Special handling for select options to display their label instead of raw value
        const displayValue = input.type === 'select' 
          ? (input.options.find(opt => opt.value === value)?.label || value)
          : value;
        content += `${input.label}: ${displayValue}\n`;
      });
      content += `\n`;
    } else if (resultType === 'image') {
      content += `--- Report Analysis ---
File: ${imageFile ? imageFile.name : 'N/A'}
Disease Type: ${diseaseName}

`;
    }

    content += `--- Prediction Result ---
Hypothetical Risk: ${result.stage} ${result.indicator}
Reasoning: ${result.message}

`;
    content += `Disclaimer: This tool provides a hypothetical risk assessment based on simplified logic and AI/ML analysis. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for any health concerns or before making any decisions related to your health.`;

    return content;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 flex flex-col items-center py-10 px-4 font-inter">
      {/* Tailwind CSS CDN for styling */}
      <script src="https://cdn.tailwindcss.com"></script>
      {/* Google Fonts - Inter for a clean modern look */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
          }
          @keyframes bounce-once {
            0%, 100% {
              transform: translateY(0);
            }
            25% {
              transform: translateY(-5px);
            }
            50% {
              transform: translateY(0px);
            }
            75% {
              transform: translateY(-2px);
            }
          }
          .animate-bounce-once {
            animation: bounce-once 1s ease-in-out;
          }
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
          }
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
          }
          .modal-content {
            background: white;
            padding: 2rem;
            border-radius: 0.75rem; /* rounded-xl */
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* shadow-lg */
            max-width: 90%;
            max-height: 90%;
            overflow-y: auto;
            position: relative;
            animation: fade-in 0.3s ease-out forwards;
          }
          .modal-close-button {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #4a5568; /* gray-700 */
          }

          /* Loading Overlay Styles */
          .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9); /* Semi-transparent white */
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1001; /* Above other modals */
            font-family: 'Inter', sans-serif;
            color: #115e59; /* teal-800 */
            text-align: center;
            font-size: 1.5rem;
            font-weight: 600;
          }
          .spinner {
            border: 4px solid #f3f3f3; /* Light grey */
            border-top: 4px solid #14b8a6; /* Teal-500 */
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 w-full max-w-2xl border border-teal-200">
        <h1 className="text-4xl font-extrabold text-center text-teal-900 mb-8 leading-tight">
          Health Risk Predictor
        </h1>

        {/* Patient Name Input */}
        <div className="mb-6">
          <label htmlFor="patientName" className="block text-lg font-semibold text-teal-800 mb-2">
            Patient Name (Optional):
          </label>
          <input
            type="text"
            id="patientName"
            value={patientName}
            onChange={handlePatientNameChange}
            placeholder="e.g., John Doe"
            className="block w-full pl-4 pr-10 py-3 text-base border-teal-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none transition duration-150 ease-in-out bg-white"
          />
        </div>

        {/* Disease Selector */}
        <div className="mb-8">
          <label htmlFor="disease-select" className="block text-lg font-semibold text-teal-800 mb-2">
            Choose a Predictor:
          </label>
          <div className="relative">
            <select
              id="disease-select"
              value={selectedDiseaseId}
              onChange={(e) => setSelectedDiseaseId(e.target.value)}
              className="block w-full pl-4 pr-10 py-3 text-base border-teal-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none transition duration-150 ease-in-out cursor-pointer bg-white"
            >
              {diseases.map(disease => (
                <option key={disease.id} value={disease.id}>
                  {disease.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-teal-700">
              <svg className="fill-current h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Prediction Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-3xl font-bold text-teal-800 text-center mb-6">
            {selectedDisease.name}
          </h2>

          {/* Dynamically rendered input fields based on the selected disease */}
          {selectedDisease.inputs.map(input => (
            <div key={input.id}>
              <label htmlFor={input.id} className="block text-md font-medium text-teal-700 mb-1">
                {input.label}:
              </label>
              {input.type === 'select' ? (
                <select
                  id={input.id}
                  value={inputValues[input.id] || ''} // Ensure controlled component
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-teal-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition duration-150 ease-in-out"
                  required
                >
                  {input.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={input.type}
                  id={input.id}
                  value={inputValues[input.id] || ''} // Ensure controlled component
                  onChange={handleChange}
                  placeholder={input.placeholder}
                  step={input.step}
                  min={input.min}
                  max={input.max}
                  className="mt-1 block w-full px-3 py-2 border border-teal-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition duration-150 ease-in-out"
                  required
                />
              )}
              {input.description && (
                <p className="text-sm text-teal-600 mt-1 opacity-75 italic">
                  {input.description}
                </p>
              )}
            </div>
          ))}
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-xl font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-200 ease-in-out transform hover:scale-105"
            disabled={isLoading}
          >
            {isFormPredicting ? 'Analyzing Form Data...' : 'Get Risk Assessment (Form)'}
          </button>
        </form>

        {/* Report Upload Section (Now always conditional on supportsImage being true in disease config) */}
        {selectedDisease.supportsImage && (
          <div className="mt-8 pt-6 border-t border-teal-200 space-y-4">
            <h3 className="text-2xl font-bold text-teal-800 text-center mb-4">
              Upload Report for Analysis
            </h3>
            <div className="flex flex-col items-center space-y-4">
              <label htmlFor="report-upload" className="block text-md font-medium text-teal-700">
                Select a report file (e.g., PDF, JPG, PNG):
              </label>
              <input
                type="file"
                id="report-upload"
                accept="image/*, application/pdf" 
                onChange={handleImageChange}
                className="block w-full max-w-xs text-sm text-teal-700 file:mr-4 file:py-2 file:px-4
                           file:rounded-lg file:border-0 file:text-sm file:font-semibold
                           file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100
                           transition duration-150 ease-in-out cursor-pointer"
              />
              {imagePreviewUrl && imageFile && imageFile.type.startsWith('image/') && (
                <div className="mt-4 text-center">
                  <p className="text-teal-600 text-sm mb-2">Image Preview:</p>
                  <img src={imagePreviewUrl} alt="Report Preview" className="max-w-full h-auto rounded-lg shadow-md border border-teal-200 object-contain mx-auto" style={{ maxHeight: '200px' }} />
                </div>
              )}
              {imagePreviewUrl && imageFile && imageFile.type === 'application/pdf' && (
                  <div className="mt-4 text-center text-teal-600">
                      <p className="text-sm mb-2">PDF file selected. No preview available here, but it will be sent for analysis.</p>
                  </div>
              )}
              <button
                onClick={analyzeImageWithBackend}
                className="w-full max-w-xs flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-xl font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-200 ease-in-out transform hover:scale-105" 
                disabled={isLoading || !imageFile}
              >
                {isImagePredicting ? 'Uploading & Analyzing...' : 'Upload & Analyze Report'}
              </button>
            </div>
          </div>
        )}


        {/* Prediction Results Display */}
        {(formPredictionResult || imagePredictionResult) && (
          <div className="mt-10 p-6 bg-teal-50 rounded-xl border border-teal-200 shadow-lg animate-fade-in">
            <h3 className="text-2xl font-bold text-teal-800 mb-4 text-center">Your Hypothetical Risk:</h3>

            {/* Form-based results - no longer needs separate loading indicator here */}
            {formPredictionResult && !isFormPredicting && (
              <div className="mb-6 pb-4 border-b border-teal-200 last:border-b-0">
                <p className="text-xl font-semibold text-teal-700 mb-2">Form-Based Analysis:</p>
                <p className="text-teal-700 text-center mt-4 text-lg leading-relaxed whitespace-pre-line">
                  {formatResultMessage('form', formPredictionResult)}
                </p>
                <p className="text-4xl font-extrabold text-teal-900 flex items-center justify-center gap-3 mt-4">
                  {formPredictionResult.stage}
                  <span className="text-5xl animate-bounce-once">{formPredictionResult.indicator}</span>
                </p>
              </div>
            )}

            {/* Image-based results - no longer needs separate loading indicator here */}
            {imagePredictionResult && !isImagePredicting && (
              <div className="mt-6">
                <p className="text-xl font-semibold text-teal-700 mb-2">Report Analysis (AI Model):</p>
                <p className="text-teal-700 text-center mt-4 text-lg leading-relaxed whitespace-pre-line">
                  {formatResultMessage('image', imagePredictionResult)}
                </p>
                <p className="text-4xl font-extrabold text-teal-900 flex items-center justify-center gap-3 mt-4">
                  {imagePredictionResult.stage}
                  <span className="text-5xl animate-bounce-once">{imagePredictionResult.indicator}</span>
                </p>
              </div>
            )}

            <p className="text-sm text-teal-600 mt-6 italic text-center">
              Disclaimer: This tool provides a hypothetical risk assessment based on simplified logic and AI/ML analysis. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for any health concerns or before making any decisions related to your health.
            </p>

            {/* Added Doctor Consultation Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => navigate('/doctors')}
                className="flex-1 py-3 px-6 bg-teal-700 text-white rounded-lg shadow-md hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-600 transition duration-200 ease-in-out transform hover:scale-105 text-lg font-semibold"
              >
                Find Doctors
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Modal */}
      {showSummaryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-button" onClick={() => setShowSummaryModal(false)}>
              &times;
            </button>
            <h2 className="text-2xl font-bold text-teal-800 mb-4 text-center">Summary of Analysis</h2>
            <pre className="text-teal-700 text-base leading-relaxed whitespace-pre-wrap font-mono bg-teal-50 p-4 rounded-lg border border-teal-200">
              {summaryModalContent}
            </pre>
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="py-2 px-6 bg-teal-600 text-white rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-200 ease-in-out"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>{globalLoadingMessage}</p>
        </div>
      )}
    </div>
  );
}

export default DiseasePredictor;
