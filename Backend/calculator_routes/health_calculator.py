from flask import Blueprint, request, jsonify

health_calc_bp = Blueprint('health_calc_bp', __name__)

# Function to calculate BMI
def calculate_bmi(weight, height):
    height_m = height / 100
    bmi = weight / (height_m * height_m)
    if bmi < 18.5:
        category = "Underweight"
    elif 18.5 <= bmi < 25:
        category = "Normal weight"
    elif 25 <= bmi < 30:
        category = "Overweight"
    else:
        category = "Obese"
    return round(bmi, 1), category

# BMR calculation (Mifflin-St Jeor)
def calculate_bmr(weight, height, age, gender):
    if gender == "male":
        return round(10*weight + 6.25*height - 5*age + 5)
    else:
        return round(10*weight + 6.25*height - 5*age - 161)

# TDEE calculation
def calculate_tdee(bmr, activity_level):
    activity_multiplier = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very_active": 1.9
    }
    return round(bmr * activity_multiplier.get(activity_level, 1.2))

# ======================
# ROUTE
# ======================
@health_calc_bp.route('/calculate_health', methods=['POST'])
def calculate_health():
    data = request.json
    
    weight = float(data.get('weight', 0))
    height = float(data.get('height', 0))
    age = int(data.get('age', 0))
    gender = data.get('gender', 'male')
    activity_level = data.get('activity_level', 'sedentary')
    
    bmi, bmi_category = calculate_bmi(weight, height)
    bmr = calculate_bmr(weight, height, age, gender)
    tdee = calculate_tdee(bmr, activity_level)
    
    # Mock Body Fat for simplicity
    body_fat = {"bf": 20, "category": "Average"}
    
    response = {
        "bmi": {"bmi": bmi, "category": bmi_category},
        "bmr": bmr,
        "tdee": tdee,
        "body_fat": body_fat,
        "nutrition_guidance": "Maintain a balanced diet with protein, carbs, and fats.",
        "ideal_weight": "65-70 kg",
        "macros": "Protein: 100g, Carbs: 250g, Fats: 75g",
        "pregnancy_weight_gain": "Not applicable",
        "pregnancy_conception_tips": {"conception_tips": [], "pregnancy_fitness_tips": []}
    }
    
    return jsonify(response)
