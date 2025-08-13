import React, { useState } from 'react';
import axios from 'axios';

const HealthAndFitnessCalculator = () => {
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    age: '',
    gender: '',
    activity_level: '',
    neck: '',
    waist: '',
    hip: '',
    pre_preg_weight: '',
    current_weight: '',
    trimester: '',
    goal: 'maintenance',
  });

  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // State to manage focus styles dynamically for inputs
  const [focusedInput, setFocusedInput] = useState(null);
  // State to manage button hover style
  const [isButtonHovered, setIsButtonHovered] = useState(false);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResults(null);

    try {
      // Temporarily mock the API call for demonstration
      // In a real application, ensure your backend server is running at http://127.00.1:5005
      const mockResponse = {
        bmi: { bmi: 22.5, category: 'Normal weight' }, // Example category
        nutrition_guidance: 'Maintain a balanced diet with adequate protein, carbs, and healthy fats.',
        bmr: 1500,
        tdee: 2250,
        body_fat: { bf: 20, category: 'Average' }, // Example category
        ideal_weight: '65-70 kg',
        macros: 'Protein: 100g, Carbs: 250g, Fats: 75g',
        pregnancy_weight_gain: formData.gender === 'female' ? '11.5-16 kg (for normal BMI)' : 'Not applicable (assuming non-pregnant input)',
        pregnancy_conception_tips: {
          conception_tips: formData.gender === 'female' ? ['Consult a doctor', 'Track ovulation', 'Maintain a healthy weight'] : [],
          pregnancy_fitness_tips: formData.gender === 'female' ? ['Low-impact exercises', 'Stay hydrated', 'Listen to your body'] : [],
        },
      };

      // Simulating different BMI and Body Fat categories for testing colors
      const currentWeight = parseFloat(formData.weight);
      const currentHeight = parseFloat(formData.height) / 100; // convert cm to meters
      let bmiCategory = 'Normal weight';
      let bodyFatCategory = 'Average';

      if (currentHeight && currentWeight) {
        const calculatedBMI = currentWeight / (currentHeight * currentHeight);
        if (calculatedBMI < 18.5) {
          bmiCategory = 'Underweight';
        } else if (calculatedBMI >= 18.5 && calculatedBMI < 25) {
          bmiCategory = 'Normal weight';
        } else if (calculatedBMI >= 25 && calculatedBMI < 30) {
          bmiCategory = 'Overweight';
        } else {
          bmiCategory = 'Obese';
        }
        mockResponse.bmi.bmi = calculatedBMI.toFixed(1);
        mockResponse.bmi.category = bmiCategory;
      }

      // Simulate body fat categories (very rough estimation for demonstration)
      const currentBodyFat = parseFloat(formData.body_fat); // Assuming this comes from input or calculation
      if (formData.gender === 'male') {
        if (currentBodyFat < 6) bodyFatCategory = 'Essential Fat';
        else if (currentBodyFat >= 6 && currentBodyFat <= 13) bodyFatCategory = 'Athletes';
        else if (currentBodyFat > 13 && currentBodyFat <= 17) bodyFatCategory = 'Fitness';
        else if (currentBodyFat > 17 && currentBodyFat <= 24) bodyFatCategory = 'Average';
        else bodyFatCategory = 'Obese';
      } else if (formData.gender === 'female') {
        if (currentBodyFat < 14) bodyFatCategory = 'Essential Fat';
        else if (currentBodyFat >= 14 && currentBodyFat <= 20) bodyFatCategory = 'Athletes';
        else if (currentBodyFat > 20 && currentBodyFat <= 24) bodyFatCategory = 'Fitness';
        else if (currentBodyFat > 24 && currentBodyFat <= 31) bodyFatCategory = 'Average';
        else bodyFatCategory = 'Obese';
      }
      mockResponse.body_fat.category = bodyFatCategory;


      setResults(mockResponse);

      // Uncomment the lines below and remove the mockResponse once your backend is ready
      // const res = await axios.post('http://127.00.1:5005/calculate_health', formData);
      // setResults(res.data);
    } catch (err) {
      console.error('Error:', err);
      setError('Something went wrong. Please ensure all fields are filled correctly and the server is running.');
    }
  };

  // Define color mapping for categories
  const categoryColors = {
    'Normal weight': '#28A745', // Green
    'Underweight': '#6B8E23', // Olive Green (less severe than red)
    'Overweight': '#FFC107', // Orange/Amber
    'Obese': '#DC3545', // Red
    'Average': '#FFC107', // Yellow/Orange
    'Essential Fat': '#17A2B8', // Info Blue
    'Athletes': '#28A745', // Green
    'Fitness': '#007BFF', // Blue
  };

  // Styles for the enhanced UI
 const containerStyle = {
    background: 'linear-gradient(to bottom, #F0FDFA, #CCFBF1)',
    minHeight: '100vh',
    padding: '40px 20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
};

  const cardStyle = {
    backgroundColor: '#ffffff',
    maxWidth: '650px',
    width: '100%',
    padding: '35px 40px',
    borderRadius: '15px',
    color: '#333',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
    border: '1px solid #B2DFDB', // Teal-100 border
  };

  const headingStyle = {
    textAlign: 'center',
    color: '#134E4A', // Darker Teal (Teal-700)
    marginBottom: '30px',
    fontSize: '2.2em',
    fontWeight: 790,
  };

  const inputGroupStyle = {
    marginBottom: '18px',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontWeight: 'bold',
    color: '#115E59', // A nice green for labels
    fontSize: '0.95em',
  };

  // Define inputFieldStyle with boxSizing: 'border-box'
  const inputFieldStyle = {
    width: '100%',
    padding: '12px 15px',
    borderRadius: '8px',
    border: '1px solid #BDBDBD', // Light grey border
    fontSize: '1em',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    boxSizing: 'border-box', // Crucial for consistent sizing
  };

  const focusStyle = {
    borderColor: '#00796B', // Darker Teal on focus
    boxShadow: '0 0 0 3px rgba(0, 121, 107, 0.2)', // Teal shadow on focus
    outline: 'none',
  };

  const buttonStyle = {
    width: '100%',
    backgroundColor: '#009688', // Teal-500
    color: 'white',
    padding: '14px',
    borderRadius: '8px',
    fontSize: '1.1em',
    border: 'none',
    cursor: 'pointer',
    marginTop: '25px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s ease, transform 0.2s ease',
  };

  const buttonHoverStyle = {
    backgroundColor: '#00796B', // Darker Teal on hover
    transform: 'translateY(-2px)',
  };

  const errorStyle = {
    color: '#D32F2F', // Red for errors
    marginTop: '15px',
    textAlign: 'center',
    fontSize: '0.9em',
    fontWeight: 'bold',
  };

  const resultsContainerStyle = {
    marginTop: '40px',
    paddingTop: '25px',
    borderTop: '1px solid #E0E0E0',
  };

  const resultsHeadingStyle = {
    color: '#00796B', // Darker Teal
    marginBottom: '20px',
    fontSize: '1.8em',
    textAlign: 'center',
  };

  const resultItemStyle = {
    marginBottom: '10px',
    fontSize: '1.05em',
    lineHeight: '1.6',
    color: '#555',
  };

  const strongStyle = {
    color: '#00796B', // Darker Teal for strong text
  };

  const ulStyle = {
    listStyleType: 'none',
    paddingLeft: '0',
  };

  const liStyle = {
    marginBottom: '8px',
    background: '#E0F2F1', // Light Teal for list items
    padding: '10px 15px',
    borderRadius: '8px',
    borderLeft: '4px solid #009688', // Teal accent on left
    color: '#444',
  };

  // Determine if pregnancy fields should be enabled
  const isFemale = formData.gender === 'female';

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={headingStyle}>Health and Fitness Calculator</h2>
        <form onSubmit={handleSubmit}>
          <div style={inputGroupStyle}>
            <label htmlFor="weight" style={labelStyle}>Weight (kg):</label>
            <input
              type="number"
              id="weight"
              name="weight"
              placeholder="e.g., 70"
              value={formData.weight}
              onChange={handleChange}
              style={focusedInput === 'weight' ? { ...inputFieldStyle, ...focusStyle } : inputFieldStyle}
              onFocus={() => setFocusedInput('weight')}
              onBlur={() => setFocusedInput(null)}
            />
          </div>

          <div style={inputGroupStyle}>
            <label htmlFor="height" style={labelStyle}>Height (cm):</label>
            <input
              type="number"
              id="height"
              name="height"
              placeholder="e.g., 175"
              value={formData.height}
              onChange={handleChange}
              style={focusedInput === 'height' ? { ...inputFieldStyle, ...focusStyle } : inputFieldStyle}
              onFocus={() => setFocusedInput('height')}
              onBlur={() => setFocusedInput(null)}
            />
          </div>

          <div style={inputGroupStyle}>
            <label htmlFor="age" style={labelStyle}>Age:</label>
            <input
              type="number"
              id="age"
              name="age"
              placeholder="e.g., 30"
              value={formData.age}
              onChange={handleChange}
              style={focusedInput === 'age' ? { ...inputFieldStyle, ...focusStyle } : inputFieldStyle}
              onFocus={() => setFocusedInput('age')}
              onBlur={() => setFocusedInput(null)}
            />
          </div>

          <div style={inputGroupStyle}>
            <label htmlFor="gender" style={labelStyle}>Gender:</label>
            <select
              id="gender"
              name="gender"
              onChange={handleChange}
              value={formData.gender} // Bind value to state
              style={focusedInput === 'gender' ? { ...inputFieldStyle, ...focusStyle } : inputFieldStyle}
              onFocus={() => setFocusedInput('gender')}
              onBlur={() => setFocusedInput(null)}
            >
              <option value="" disabled>Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div style={inputGroupStyle}>
            <label htmlFor="activity_level" style={labelStyle}>Activity Level:</label>
            <select
              id="activity_level"
              name="activity_level"
              onChange={handleChange}
              value={formData.activity_level} // Bind value to state
              style={focusedInput === 'activity_level' ? { ...inputFieldStyle, ...focusStyle } : inputFieldStyle}
              onFocus={() => setFocusedInput('activity_level')}
              onBlur={() => setFocusedInput(null)}
            >
              <option value="" disabled>Select Activity Level</option>
              <option value="sedentary">Sedentary (little or no exercise)</option>
              <option value="light">Lightly Active (1–3 days/week)</option>
              <option value="moderate">Moderately Active (3–5 days/week)</option>
              <option value="active">Very Active (6–7 days/week)</option>
              <option value="very_active">Extra Active (intense daily exercise)</option>
            </select>
          </div>

          <div style={inputGroupStyle}>
            <label htmlFor="neck" style={labelStyle}>Neck (cm) (for Body Fat):</label>
            <input
              type="number"
              id="neck"
              name="neck"
              placeholder="e.g., 38"
              value={formData.neck}
              onChange={handleChange}
              style={focusedInput === 'neck' ? { ...inputFieldStyle, ...focusStyle } : inputFieldStyle}
              onFocus={() => setFocusedInput('neck')}
              onBlur={() => setFocusedInput(null)}
            />
          </div>

          <div style={inputGroupStyle}>
            <label htmlFor="waist" style={labelStyle}>Waist (cm) (for Body Fat):</label>
            <input
              type="number"
              id="waist"
              name="waist"
              placeholder="e.g., 85"
              value={formData.waist}
              onChange={handleChange}
              style={focusedInput === 'waist' ? { ...inputFieldStyle, ...focusStyle } : inputFieldStyle}
              onFocus={() => setFocusedInput('waist')}
              onBlur={() => setFocusedInput(null)}
            />
          </div>

          <div style={inputGroupStyle}>
            <label htmlFor="hip" style={labelStyle}>Hip (cm) (for Body Fat - Females only):</label>
            <input
              type="number"
              id="hip"
              name="hip"
              placeholder="e.g., 95 (leave blank if male)"
              value={formData.hip}
              onChange={handleChange}
              // Disable or make read-only if not female
              disabled={!isFemale}
              style={focusedInput === 'hip' || !isFemale ? { ...inputFieldStyle, ...focusStyle, ...(isFemale ? {} : { backgroundColor: '#f0f0f0', cursor: 'not-allowed' }) } : inputFieldStyle}
              onFocus={() => setFocusedInput('hip')}
              onBlur={() => setFocusedInput(null)}
            />
          </div>

          <hr style={{ borderTop: '1px dashed #B2DFDB', margin: '30px 0' }} />

          {/* Conditionally render pregnancy information section */}
          {isFemale && (
            <>
              <h3 style={{ color: '#00796B', marginBottom: '20px', textAlign: 'center' }}>Pregnancy Information (Optional)</h3>

              <div style={inputGroupStyle}>
                <label htmlFor="pre_preg_weight" style={labelStyle}>Pre-pregnancy Weight (kg):</label>
                <input
                  type="number"
                  id="pre_preg_weight"
                  name="pre_preg_weight"
                  placeholder="e.g., 60"
                  value={formData.pre_preg_weight}
                  onChange={handleChange}
                  disabled={!isFemale}
                  style={focusedInput === 'pre_preg_weight' || !isFemale ? { ...inputFieldStyle, ...focusStyle, ...(isFemale ? {} : { backgroundColor: '#f0f0f0', cursor: 'not-allowed' }) } : inputFieldStyle}
                  onFocus={() => setFocusedInput('pre_preg_weight')}
                  onBlur={() => setFocusedInput(null)}
                />
              </div>

              <div style={inputGroupStyle}>
                <label htmlFor="current_weight" style={labelStyle}>Current Weight (kg):</label>
                <input
                  type="number"
                  id="current_weight"
                  name="current_weight"
                  placeholder="e.g., 65"
                  value={formData.current_weight}
                  onChange={handleChange}
                  disabled={!isFemale}
                  style={focusedInput === 'current_weight' || !isFemale ? { ...inputFieldStyle, ...focusStyle, ...(isFemale ? {} : { backgroundColor: '#f0f0f0', cursor: 'not-allowed' }) } : inputFieldStyle}
                  onFocus={() => setFocusedInput('current_weight')}
                  onBlur={() => setFocusedInput(null)}
                />
              </div>

              <div style={inputGroupStyle}>
                <label htmlFor="trimester" style={labelStyle}>Trimester:</label>
                <select
                  id="trimester"
                  name="trimester"
                  onChange={handleChange}
                  value={formData.trimester} // Bind value to state
                  disabled={!isFemale}
                  style={focusedInput === 'trimester' || !isFemale ? { ...inputFieldStyle, ...focusStyle, ...(isFemale ? {} : { backgroundColor: '#f0f0f0', cursor: 'not-allowed' }) } : inputFieldStyle}
                  onFocus={() => setFocusedInput('trimester')}
                  onBlur={() => setFocusedInput(null)}
                >
                  <option value="" disabled>Select Trimester</option>
                  <option value="first">First</option>
                  <option value="second">Second</option>
                  <option value="third">Third</option>
                </select>
              </div>
              <hr style={{ borderTop: '1px dashed #B2DFDB', margin: '30px 0' }} />
            </>
          )}

          <div style={inputGroupStyle}>
            <label htmlFor="goal" style={labelStyle}>Your Goal:</label>
            <select
              id="goal"
              name="goal"
              onChange={handleChange}
              value={formData.goal} // Bind value to state
              style={focusedInput === 'goal' ? { ...inputFieldStyle, ...focusStyle } : inputFieldStyle}
              onFocus={() => setFocusedInput('goal')}
              onBlur={() => setFocusedInput(null)}
            >
              <option value="maintenance">Maintenance</option>
              <option value="weight_loss">Weight Loss</option>
              <option value="muscle_gain">Muscle Gain</option>
            </select>
          </div>

          <button
            type="submit"
            style={isButtonHovered ? { ...buttonStyle, ...buttonHoverStyle } : buttonStyle}
            onMouseEnter={() => setIsButtonHovered(true)}
            onMouseLeave={() => setIsButtonHovered(false)}
          >
            Calculate All Metrics
          </button>
        </form>

        {error && <p style={errorStyle}>{error}</p>}

        {results && (
          <div style={resultsContainerStyle}>
            <h3 style={resultsHeadingStyle}>Your Health Metrics</h3>
            <p style={resultItemStyle}>
              <strong style={strongStyle}>BMI:</strong> {results.bmi?.bmi} (<span style={{ fontWeight: 'bold', color: categoryColors[results.bmi?.category] || '#333' }}>{results.bmi?.category}</span>)
            </p>
            <p style={resultItemStyle}>
              <strong style={strongStyle}>Nutrition Guidance:</strong> {results.nutrition_guidance}
            </p>
            <p style={resultItemStyle}>
              <strong style={strongStyle}>Basal Metabolic Rate (BMR):</strong> {results.bmr} calories/day
            </p>
            <p style={resultItemStyle}>
              <strong style={strongStyle}>Total Daily Energy Expenditure (TDEE):</strong> {results.tdee} calories/day
            </p>
            <p style={resultItemStyle}>
              <strong style={strongStyle}>Body Fat:</strong> {results.body_fat?.bf}% (<span style={{ fontWeight: 'bold', color: categoryColors[results.body_fat?.category] || '#333' }}>{results.body_fat?.category}</span>)
            </p>
            <p style={resultItemStyle}>
              <strong style={strongStyle}>Ideal Weight Range:</strong> {results.ideal_weight}
            </p>
            <p style={resultItemStyle}>
              <strong style={strongStyle}>Recommended Macros:</strong> {results.macros}
            </p>

            {results.pregnancy_weight_gain && results.pregnancy_weight_gain !== 'Not applicable' && (
              <p style={resultItemStyle}>
                <strong style={strongStyle}>Recommended Pregnancy Weight Gain:</strong> {results.pregnancy_weight_gain}
              </p>
            )}

            {(results.pregnancy_conception_tips?.conception_tips?.length > 0 ||
              results.pregnancy_conception_tips?.pregnancy_fitness_tips?.length > 0) && (
              <div style={{ marginTop: '25px' }}>
                <h4 style={{ color: '#00796B', marginBottom: '15px', fontSize: '1.4em' }}>Pregnancy and Conception Tips</h4>
                {results.pregnancy_conception_tips?.conception_tips?.length > 0 && (
                  <>
                    <h5 style={{ color: '#00796B', marginBottom: '10px' }}>Conception Tips:</h5>
                    <ul style={ulStyle}>
                      {results.pregnancy_conception_tips.conception_tips.map((tip, idx) => (
                        <li key={`conception-${idx}`} style={liStyle}>{tip}</li>
                      ))}
                    </ul>
                  </>
                )}
                {results.pregnancy_conception_tips?.pregnancy_fitness_tips?.length > 0 && (
                  <>
                    <h5 style={{ color: '#00796B', marginBottom: '10px' }}>Pregnancy Fitness Tips:</h5>
                    <ul style={ulStyle}>
                      {results.pregnancy_conception_tips.pregnancy_fitness_tips.map((tip, idx) => (
                        <li key={`fitness-${idx}`} style={liStyle}>{tip}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthAndFitnessCalculator;