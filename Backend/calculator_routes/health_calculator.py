from flask import Blueprint, request, jsonify
import math

health_calc_bp = Blueprint('health_calc_bp', __name__)

print("✅ Health_Calculator models loaded successfully.")

# --- Logic Functions ---

def calculate_bmi_logic(weight, height_cm):
    if not all(isinstance(x, (int, float)) and x > 0 for x in [weight, height_cm]):
        return {'bmi': None, 'category': 'Invalid input for BMI'}

    height_m = height_cm / 100
    bmi_val = weight / (height_m * height_m)
    category = ''
    if bmi_val < 18.5:
        category = 'Underweight (Thinness)'
    elif 18.5 <= bmi_val <= 24.9:
        category = 'Normal weight'
    elif 25 <= bmi_val <= 29.9:
        category = 'Overweight'
    else:
        category = 'Obesity'
    return {'bmi': f"{bmi_val:.2f}", 'category': category}

def get_nutrition_guidance_logic(age, gender):
    if not all([isinstance(age, int) and age > 0, gender]):
        return 'Please provide valid age and gender for nutrition guidance.'

    if 0 <= age <= 1:
        return "For infants, nutrition primarily comes from breast milk or formula. Introduce solids around 6 months."
    elif 2 <= age <= 8:
        return "Young children need a variety of foods for growth. Focus on whole grains, fruits, vegetables, lean proteins, and dairy. Limit sugary drinks and processed foods. Example: ~1000-1400 calories/day, 13-19g protein."
    elif 9 <= age <= 13:
        return "Older children need more energy for active growth. Encourage balanced meals and healthy snacks. Example: ~1400-2000 calories/day, 34g protein."
    elif 14 <= age <= 18:
        if gender == 'male':
            return "Teenage males require significant energy for growth spurts and muscle development. Focus on nutrient-dense foods, adequate protein, iron, and calcium. Example: ~2200-3200 calories/day, 52g protein."
        else:
            return "Teenage females need good nutrition for growth, especially iron for menstruation and calcium for bone health. Example: ~1800-2400 calories/day, 46g protein."
    elif 19 <= age <= 50:
        if gender == 'male':
            return "Adult males generally need 2000-3000 calories/day depending on activity. Focus on balanced meals, ample fiber, and limit saturated fats."
        else:
            return "Adult females generally need 1800-2400 calories/day depending on activity. Pay attention to iron and calcium intake."
    else:
        return "Seniors may need fewer calories but require nutrient-dense foods. Focus on protein for muscle mass, calcium and Vitamin D for bone health, and adequate fiber. Hydration is also key."

def calculate_bmr_tdee_logic(weight, height_cm, age, gender, activity_level):
    if not all([isinstance(x, (int, float)) and x > 0 for x in [weight, height_cm, age]]) or not gender or not activity_level:
        return {'bmr': None, 'tdee': 'Invalid input for BMR/TDEE.'}

    activity_multipliers = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'active': 1.725,
        'very_active': 1.9
    }

    if gender == 'male':
        bmr_value = (10 * weight) + (6.25 * height_cm) - (5 * age) + 5
    else:
        bmr_value = (10 * weight) + (6.25 * height_cm) - (5 * age) - 161
    
    tdee_value = bmr_value * activity_multipliers.get(activity_level, 1.2)

    return {'bmr': f"{bmr_value:.2f}", 'tdee': f"{tdee_value:.2f}"}

def calculate_body_fat_logic(gender, neck, waist, height_cm, hip):
    if not isinstance(neck, (int, float)) or not isinstance(waist, (int, float)) or not isinstance(height_cm, (int, float)):
        return {'bf': 'N/A', 'category': 'Invalid input for Body Fat. Neck, Waist, Height must be numeric.'}
    
    if gender == 'female' and not isinstance(hip, (int, float)):
        return {'bf': 'N/A', 'category': 'Invalid input for Body Fat. Hip measurement is required for females.'}

    neck_in = neck / 2.54
    waist_in = waist / 2.54
    height_in = height_cm / 2.54
    hip_in = hip / 2.54 if hip else 0

    try:
        if gender == 'male':
            if (waist_in - neck_in) <= 0 or height_in <= 0:
                raise ValueError("Invalid measurements for male body fat calculation")
            bf_percent = (495 / (1.0324 - 0.19077 * math.log10(waist_in - neck_in) + 0.15456 * math.log10(height_in))) - 450
        else:
            if (waist_in + hip_in - neck_in) <= 0 or height_in <= 0:
                raise ValueError("Invalid measurements for female body fat calculation")
            bf_percent = (495 / (1.29579 - 0.35004 * math.log10(waist_in + hip_in - neck_in) + 0.22100 * math.log10(height_in))) - 450
        
        if gender == 'male':
            if bf_percent < 6: category = 'Essential Fat'
            elif bf_percent <= 13: category = 'Athletes'
            elif bf_percent <= 17: category = 'Fitness'
            elif bf_percent <= 24: category = 'Acceptable'
            else: category = 'Obese'
        else:
            if bf_percent < 14: category = 'Essential Fat'
            elif bf_percent <= 20: category = 'Athletes'
            elif bf_percent <= 24: category = 'Fitness'
            elif bf_percent <= 31: category = 'Acceptable'
            else: category = 'Obese'

        return {'bf': f"{bf_percent:.2f}%", 'category': category}
    except Exception as e:
        return {'bf': 'N/A', 'category': f"Error: {e}"}

def calculate_ideal_weight_logic(height_cm, gender):
    if not all([isinstance(height_cm, (int, float)) and height_cm > 0, gender]):
        return 'Invalid input for Ideal Weight.'

    height_in = height_cm / 2.54
    if gender == 'male':
        ideal_weight_kg = 50 + 2.3 * max(0, height_in - 60)
    else:
        ideal_weight_kg = 45.5 + 2.3 * max(0, height_in - 60)
    return f"~{ideal_weight_kg:.2f} kg"

def get_macro_recommendation_logic(tdee_val, goal='maintenance'):
    if not isinstance(tdee_val, (int, float)) or tdee_val <= 0:
        return 'Invalid TDEE for Macro calculation.'

    protein_ratio, carb_ratio, fat_ratio = 0, 0, 0
    adjusted_tdee = tdee_val

    if goal == 'maintenance':
        protein_ratio, carb_ratio, fat_ratio = 0.30, 0.40, 0.30
    elif goal == 'weight_loss':
        protein_ratio, carb_ratio, fat_ratio = 0.35, 0.30, 0.35
        adjusted_tdee *= 0.8
    elif goal == 'muscle_gain':
        protein_ratio, carb_ratio, fat_ratio = 0.30, 0.50, 0.20
        adjusted_tdee *= 1.1

    protein_grams = (adjusted_tdee * protein_ratio) / 4
    carb_grams = (adjusted_tdee * carb_ratio) / 4
    fat_grams = (adjusted_tdee * fat_ratio) / 9

    return f"~P: {int(protein_grams)}g, C: {int(carb_grams)}g, F: {int(fat_grams)}g"

def get_pregnancy_weight_gain_guidance_logic(pre_preg_weight, current_weight, trimester):
    if not all(isinstance(x, (int, float)) and x > 0 for x in [pre_preg_weight, current_weight]) or not trimester:
        return 'Please provide valid weights and trimester.'

    gained_weight = current_weight - pre_preg_weight

    if trimester == 'first':
        if 0.5 <= gained_weight <= 2:
            return f"You've gained {gained_weight:.1f} kg. Typical gain for 1st trimester is 0.5-2 kg. This is within general guidelines."
        elif gained_weight < 0.5:
            return f"Weight gain is low for 1st trimester. Consult your doctor."
        else:
            return f"Weight gain is high for 1st trimester. Consult your doctor."
    elif trimester == 'second':
        target = 2 + (13 * 0.5)
        if target - 3 <= gained_weight <= target + 3:
            return f"Weight gain is generally within expected range for 2nd trimester."
        else:
            return f"Weight gain may be outside typical range for 2nd trimester. Consult your doctor."
    elif trimester == 'third':
        target = 2 + (13 * 0.5) + (14 * 0.5)
        if target - 5 <= gained_weight <= target + 5:
            return f"Weight gain is generally within expected range for 3rd trimester."
        else:
            return f"Weight gain may be outside typical range for 3rd trimester. Consult your doctor."
    return ""

def get_pregnancy_conception_fitness_tips_logic():
    return {
        "conception_tips": [
            "Maintain a balanced diet rich in folic acid and vitamins.",
            "Engage in moderate exercise like walking or swimming.",
            "Avoid smoking and excessive alcohol consumption.",
            "Manage stress with relaxation techniques."
        ],
        "pregnancy_fitness_tips": [
            "Stay active with pregnancy-safe exercises like prenatal yoga or walking.",
            "Listen to your body and avoid overexertion.",
            "Stay hydrated and maintain a nutritious diet.",
            "Consult your healthcare provider before starting any new exercise."
        ]
    }

# --- Flask route ---

@health_calc_bp.route('/calculate_health', methods=['POST'])
def calculate_health():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    try:
        weight = float(data.get('weight', 0))
        height = float(data.get('height', 0))
        age = int(data.get('age', 0))
        gender = data.get('gender', '').lower()
        activity_level = data.get('activity_level', '').lower()

        # Optional measurements
        neck = float(data.get('neck', 0)) if data.get('neck') else None
        waist = float(data.get('waist', 0)) if data.get('waist') else None
        hip = float(data.get('hip', 0)) if data.get('hip') else None

        # Pregnancy related
        pre_preg_weight = float(data.get('pre_preg_weight', 0)) if data.get('pre_preg_weight') else None
        current_weight = float(data.get('current_weight', 0)) if data.get('current_weight') else None
        trimester = data.get('trimester', '').lower()

        # Goal for macros
        goal = data.get('goal', 'maintenance').lower()

        results = {}

        # Calculate BMI
        if weight and height:
            results['bmi'] = calculate_bmi_logic(weight, height)
        else:
            results['bmi'] = {'bmi': None, 'category': 'Insufficient data for BMI'}

        # Nutrition guidance
        if age and gender:
            results['nutrition_guidance'] = get_nutrition_guidance_logic(age, gender)
        else:
            results['nutrition_guidance'] = 'Insufficient data for nutrition guidance.'

        # BMR and TDEE
        if weight and height and age and gender and activity_level:
            bmr_tdee = calculate_bmr_tdee_logic(weight, height, age, gender, activity_level)
            results['bmr'] = bmr_tdee['bmr']
            results['tdee'] = bmr_tdee['tdee']
        else:
            results['bmr'] = None
            results['tdee'] = 'Insufficient data for BMR/TDEE.'

        # Body Fat Percentage
        if gender and neck and waist and height and (gender == 'male' or (gender == 'female' and hip)):
            bf = calculate_body_fat_logic(gender, neck, waist, height, hip)
            results['body_fat'] = bf
        else:
            results['body_fat'] = {'bf': 'N/A', 'category': 'Insufficient data for body fat.'}

        # Ideal weight
        if height and gender:
            results['ideal_weight'] = calculate_ideal_weight_logic(height, gender)
        else:
            results['ideal_weight'] = 'Insufficient data for ideal weight.'

        # Macro recommendations
        try:
            tdee_val = float(results['tdee']) if results['tdee'] not in [None, 'Insufficient data for BMR/TDEE.'] else None
        except:
            tdee_val = None
        if tdee_val:
            results['macros'] = get_macro_recommendation_logic(tdee_val, goal)
        else:
            results['macros'] = 'Insufficient data for macros.'

        # Pregnancy weight gain guidance
        if pre_preg_weight and current_weight and trimester:
            results['pregnancy_weight_gain'] = get_pregnancy_weight_gain_guidance_logic(pre_preg_weight, current_weight, trimester)
        else:
            results['pregnancy_weight_gain'] = 'Insufficient data for pregnancy weight gain.'

        # Pregnancy and conception fitness tips
        results['pregnancy_conception_tips'] = get_pregnancy_conception_fitness_tips_logic()

        return jsonify(results), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
