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
  const [focusedInput, setFocusedInput] = useState(null);
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
      const res = await axios.post('http://127.0.0.1:5005/calculate_health', formData);
      setResults(res.data);
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please ensure all fields are filled correctly and the server is running.');
    }
  };

  const categoryColors = {
    'Normal weight': '#28A745',
    'Underweight': '#6B8E23',
    'Overweight': '#FFC107',
    'Obese': '#DC3545',
    'Average': '#FFC107',
    'Essential Fat': '#17A2B8',
    'Athletes': '#28A745',
    'Fitness': '#007BFF',
  };

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
    border: '1px solid #B2DFDB',
  };

  const headingStyle = {
    textAlign: 'center',
    color: '#134E4A',
    marginBottom: '30px',
    fontSize: '2.2em',
    fontWeight: 790,
  };

  const inputGroupStyle = { marginBottom: '18px' };
  const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#115E59', fontSize: '0.95em' };
  const inputFieldStyle = { width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid #BDBDBD', fontSize: '1em', transition: 'border-color 0.3s ease, box-shadow 0.3s ease', boxSizing: 'border-box' };
  const focusStyle = { borderColor: '#00796B', boxShadow: '0 0 0 3px rgba(0, 121, 107, 0.2)', outline: 'none' };
  const buttonStyle = { width: '100%', backgroundColor: '#009688', color: 'white', padding: '14px', borderRadius: '8px', fontSize: '1.1em', border: 'none', cursor: 'pointer', marginTop: '25px', fontWeight: 'bold', transition: 'background-color 0.3s ease, transform 0.2s ease' };
  const buttonHoverStyle = { backgroundColor: '#00796B', transform: 'translateY(-2px)' };
  const errorStyle = { color: '#D32F2F', marginTop: '15px', textAlign: 'center', fontSize: '0.9em', fontWeight: 'bold' };
  const resultsContainerStyle = { marginTop: '40px', paddingTop: '25px', borderTop: '1px solid #E0E0E0' };
  const resultsHeadingStyle = { color: '#00796B', marginBottom: '20px', fontSize: '1.8em', textAlign: 'center' };
  const resultItemStyle = { marginBottom: '10px', fontSize: '1.05em', lineHeight: '1.6', color: '#555' };
  const strongStyle = { color: '#00796B' };
  const ulStyle = { listStyleType: 'none', paddingLeft: '0' };
  const liStyle = { marginBottom: '8px', background: '#E0F2F1', padding: '10px 15px', borderRadius: '8px', borderLeft: '4px solid #009688', color: '#444' };
  const isFemale = formData.gender === 'female';

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={headingStyle}>Health and Fitness Calculator</h2>
        <form onSubmit={handleSubmit}>
          {/* Weight */}
          <div style={inputGroupStyle}>
            <label htmlFor="weight" style={labelStyle}>Weight (kg):</label>
            <input type="number" id="weight" name="weight" value={formData.weight} onChange={handleChange} placeholder="e.g., 70" style={focusedInput === 'weight' ? { ...inputFieldStyle, ...focusStyle } : inputFieldStyle} onFocus={() => setFocusedInput('weight')} onBlur={() => setFocusedInput(null)} />
          </div>

          {/* Height */}
          <div style={inputGroupStyle}>
            <label htmlFor="height" style={labelStyle}>Height (cm):</label>
            <input type="number" id="height" name="height" value={formData.height} onChange={handleChange} placeholder="e.g., 175" style={focusedInput === 'height' ? { ...inputFieldStyle, ...focusStyle } : inputFieldStyle} onFocus={() => setFocusedInput('height')} onBlur={() => setFocusedInput(null)} />
          </div>

          {/* Age */}
          <div style={inputGroupStyle}>
            <label htmlFor="age" style={labelStyle}>Age:</label>
            <input type="number" id="age" name="age" value={formData.age} onChange={handleChange} placeholder="e.g., 30" style={focusedInput === 'age' ? { ...inputFieldStyle, ...focusStyle } : inputFieldStyle} onFocus={() => setFocusedInput('age')} onBlur={() => setFocusedInput(null)} />
          </div>

          {/* Gender */}
          <div style={inputGroupStyle}>
            <label htmlFor="gender" style={labelStyle}>Gender:</label>
            <select id="gender" name="gender" value={formData.gender} onChange={handleChange} style={focusedInput === 'gender' ? { ...inputFieldStyle, ...focusStyle } : inputFieldStyle} onFocus={() => setFocusedInput('gender')} onBlur={() => setFocusedInput(null)}>
              <option value="" disabled>Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Activity Level */}
          <div style={inputGroupStyle}>
            <label htmlFor="activity_level" style={labelStyle}>Activity Level:</label>
            <select id="activity_level" name="activity_level" value={formData.activity_level} onChange={handleChange} style={focusedInput === 'activity_level' ? { ...inputFieldStyle, ...focusStyle } : inputFieldStyle} onFocus={() => setFocusedInput('activity_level')} onBlur={() => setFocusedInput(null)}>
              <option value="" disabled>Select Activity Level</option>
              <option value="sedentary">Sedentary (little or no exercise)</option>
              <option value="light">Lightly Active (1–3 days/week)</option>
              <option value="moderate">Moderately Active (3–5 days/week)</option>
              <option value="active">Very Active (6–7 days/week)</option>
              <option value="very_active">Extra Active (intense daily exercise)</option>
            </select>
          </div>

          {/* Neck */}
          <div style={inputGroupStyle}>
            <label htmlFor="neck" style={labelStyle}>Neck (cm) (for Body Fat):</label>
            <input type="number" id="neck" name="neck" value={formData.neck} onChange={handleChange} placeholder="e.g., 38" style={focusedInput === 'neck' ? { ...inputFieldStyle, ...focusStyle } : inputFieldStyle} onFocus={() => setFocusedInput('neck')} onBlur={() => setFocusedInput(null)} />
          </div>

          {/* Waist */}
          <div style={inputGroupStyle}>
            <label htmlFor="waist" style={labelStyle}>Waist (cm) (for Body Fat):</label>
            <input type="number" id="waist" name="waist" value={formData.waist} onChange={handleChange} placeholder="e.g., 85" style={focusedInput === 'waist' ? { ...inputFieldStyle, ...focusStyle } : inputFieldStyle} onFocus={() => setFocusedInput('waist')} onBlur={() => setFocusedInput(null)} />
          </div>

          {/* Hip (female only) */}
          <div style={inputGroupStyle}>
            <label htmlFor="hip" style={labelStyle}>Hip (cm) (Females only):</label>
            <input type="number" id="hip" name="hip" value={formData.hip} onChange={handleChange} placeholder="e.g., 95" disabled={!isFemale} style={focusedInput === 'hip' || !isFemale ? { ...inputFieldStyle, ...focusStyle, ...(isFemale ? {} : { backgroundColor: '#f0f0f0', cursor: 'not-allowed' }) } : inputFieldStyle} onFocus={() => setFocusedInput('hip')} onBlur={() => setFocusedInput(null)} />
          </div>

          {/* Pregnancy Section */}
          {isFemale && (
            <>
              <hr style={{ borderTop: '1px dashed #B2DFDB', margin: '30px 0' }} />
              <h3 style={{ color: '#00796B', marginBottom: '20px', textAlign: 'center' }}>Pregnancy Information (Optional)</h3>

              <div style={inputGroupStyle}>
                <label htmlFor="pre_preg_weight" style={labelStyle}>Pre-pregnancy Weight (kg):</label>
                <input type="number" id="pre_preg_weight" name="pre_preg_weight" value={formData.pre_preg_weight} onChange={handleChange} style={focusedInput === 'pre_preg_weight' ? { ...inputFieldStyle, ...focusStyle } : inputFieldStyle} onFocus={() => setFocusedInput('pre_preg_weight')} onBlur={() => setFocusedInput(null)} />
              </div>

              <div style={inputGroupStyle}>
                <label htmlFor="current_weight" style={labelStyle}>Current Weight (kg):</label>
                <input type="number" id="current_weight" name="current_weight" value={formData.current_weight} onChange={handleChange} style={focusedInput === 'current_weight' ? { ...inputFieldStyle, ...focusStyle } : inputFieldStyle} onFocus={() => setFocusedInput('current_weight')} onBlur={() => setFocusedInput(null)} />
              </div>

              <div style={inputGroupStyle}>
                <label htmlFor="trimester" style={labelStyle}>Trimester:</label>
                <select id="trimester" name="trimester" value={formData.trimester} onChange={handleChange} style={focusedInput === 'trimester' ? { ...inputFieldStyle, ...focusStyle } : inputFieldStyle} onFocus={() => setFocusedInput('trimester')} onBlur={() => setFocusedInput(null)}>
                  <option value="" disabled>Select Trimester</option>
                  <option value="first">First</option>
                  <option value="second">Second</option>
                  <option value="third">Third</option>
                </select>
              </div>
            </>
          )}

          {/* Goal */}
          <div style={inputGroupStyle}>
            <label htmlFor="goal" style={labelStyle}>Your Goal:</label>
            <select id="goal" name="goal" value={formData.goal} onChange={handleChange} style={focusedInput === 'goal' ? { ...inputFieldStyle, ...focusStyle } : inputFieldStyle} onFocus={() => setFocusedInput('goal')} onBlur={() => setFocusedInput(null)}>
              <option value="maintenance">Maintenance</option>
              <option value="weight_loss">Weight Loss</option>
              <option value="muscle_gain">Muscle Gain</option>
            </select>
          </div>

          <button type="submit" style={isButtonHovered ? { ...buttonStyle, ...buttonHoverStyle } : buttonStyle} onMouseEnter={() => setIsButtonHovered(true)} onMouseLeave={() => setIsButtonHovered(false)}>
            Calculate All Metrics
          </button>
        </form>

        {error && <p style={errorStyle}>{error}</p>}

        {results && (
          <div style={resultsContainerStyle}>
            <h3 style={resultsHeadingStyle}>Your Health Metrics</h3>
            <p style={resultItemStyle}><strong style={strongStyle}>BMI:</strong> {results.bmi?.bmi} (<span style={{ fontWeight: 'bold', color: categoryColors[results.bmi?.category] || '#333' }}>{results.bmi?.category}</span>)</p>
            <p style={resultItemStyle}><strong style={strongStyle}>BMR:</strong> {results.bmr} calories/day</p>
            <p style={resultItemStyle}><strong style={strongStyle}>TDEE:</strong> {results.tdee} calories/day</p>
            <p style={resultItemStyle}><strong style={strongStyle}>Body Fat:</strong> {results.body_fat?.bf}% (<span style={{ fontWeight: 'bold', color: categoryColors[results.body_fat?.category] || '#333' }}>{results.body_fat?.category}</span>)</p>
            <p style={resultItemStyle}><strong style={strongStyle}>Nutrition Guidance:</strong> {results.nutrition_guidance}</p>
            <p style={resultItemStyle}><strong style={strongStyle}>Ideal Weight:</strong> {results.ideal_weight}</p>
            <p style={resultItemStyle}><strong style={strongStyle}>Macros:</strong> {results.macros}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthAndFitnessCalculator;
