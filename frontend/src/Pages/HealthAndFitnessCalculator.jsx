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

  // --- REFACTORED STYLES ---
  const styles = {
    container: {
      background: 'linear-gradient(to bottom, #F0FDFA, #CCFBF1)',
      minHeight: '100vh',
      padding: '20px', // Reduced padding
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start', // Start aligned instead of centered for better scrolling
      paddingTop: '60px',
      paddingBottom: '60px',
    },
    card: {
      backgroundColor: '#ffffff',
      maxWidth: '550px', // Smaller maximum width
      width: '100%',
      padding: '30px', // Reduced padding
      borderRadius: '15px',
      color: '#333',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
      border: '1px solid #B2DFDB',
    },
    heading: {
      textAlign: 'center',
      color: '#134E4A',
      marginBottom: '25px', // Reduced margin
      fontSize: '1.8em', // Smaller font size
      fontWeight: 790,
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr', // Two columns for better use of space
        gap: '20px 25px', // Spacing between fields
        marginBottom: '10px',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
    },
    label: { 
        marginBottom: '6px', 
        fontWeight: 'bold', 
        color: '#115E59', 
        fontSize: '0.9em' // Slightly smaller
    },
    inputField: { 
        padding: '10px 12px', // Reduced padding
        borderRadius: '6px', // Slightly smaller border radius
        border: '1px solid #D1D5DB', // Lighter border
        fontSize: '0.95em', 
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease', 
        boxSizing: 'border-box'
    },
    fullWidth: {
        gridColumn: '1 / -1', // Span across both columns
    },
    focus: { 
        borderColor: '#00796B', 
        boxShadow: '0 0 0 3px rgba(0, 121, 107, 0.2)', 
        outline: 'none' 
    },
    disabled: { 
        backgroundColor: '#f8f8f8', 
        cursor: 'not-allowed' 
    },
    button: { 
        width: '100%', 
        backgroundColor: '#009688', 
        color: 'white', 
        padding: '12px', // Reduced padding
        borderRadius: '6px', 
        fontSize: '1em', 
        border: 'none', 
        cursor: 'pointer', 
        marginTop: '25px', 
        fontWeight: 'bold', 
        transition: 'background-color 0.3s ease, transform 0.2s ease' 
    },
    buttonHover: { 
        backgroundColor: '#00796B', 
        transform: 'translateY(-1px)' 
    },
    error: { 
        color: '#D32F2F', 
        marginTop: '15px', 
        textAlign: 'center', 
        fontSize: '0.9em', 
        fontWeight: 'bold' 
    },
    resultsContainer: { 
        marginTop: '30px', 
        paddingTop: '20px', 
        borderTop: '1px solid #E0E0E0' 
    },
    resultsHeading: { 
        color: '#00796B', 
        marginBottom: '15px', 
        fontSize: '1.5em', 
        textAlign: 'center' 
    },
    resultItem: { 
        marginBottom: '8px', 
        fontSize: '0.95em', 
        lineHeight: '1.4', 
        color: '#555' 
    },
    strong: { 
        color: '#00796B' 
    },
    hrDashed: { 
        borderTop: '1px dashed #B2DFDB', 
        margin: '25px 0' 
    },
    subHeading: { 
        color: '#00796B', 
        marginBottom: '15px', 
        textAlign: 'center',
        fontSize: '1.1em'
    }
  };

  const isFemale = formData.gender === 'female';

  // Helper function for input styles
  const getInputStyle = (name) => ({ 
    ...styles.inputField, 
    ...(focusedInput === name ? styles.focus : {}),
  });

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Health & Fitness Calculator</h2>
        <form onSubmit={handleSubmit}>
          
          <div style={styles.formGrid}>
            {/* Weight */}
            <div style={styles.inputGroup}>
              <label htmlFor="weight" style={styles.label}>Weight (kg):</label>
              <input type="number" id="weight" name="weight" value={formData.weight} onChange={handleChange} placeholder="e.g., 70" style={getInputStyle('weight')} onFocus={() => setFocusedInput('weight')} onBlur={() => setFocusedInput(null)} />
            </div>

            {/* Height */}
            <div style={styles.inputGroup}>
              <label htmlFor="height" style={styles.label}>Height (cm):</label>
              <input type="number" id="height" name="height" value={formData.height} onChange={handleChange} placeholder="e.g., 175" style={getInputStyle('height')} onFocus={() => setFocusedInput('height')} onBlur={() => setFocusedInput(null)} />
            </div>

            {/* Age */}
            <div style={styles.inputGroup}>
              <label htmlFor="age" style={styles.label}>Age:</label>
              <input type="number" id="age" name="age" value={formData.age} onChange={handleChange} placeholder="e.g., 30" style={getInputStyle('age')} onFocus={() => setFocusedInput('age')} onBlur={() => setFocusedInput(null)} />
            </div>

            {/* Gender */}
            <div style={styles.inputGroup}>
              <label htmlFor="gender" style={styles.label}>Gender:</label>
              <select id="gender" name="gender" value={formData.gender} onChange={handleChange} style={getInputStyle('gender')} onFocus={() => setFocusedInput('gender')} onBlur={() => setFocusedInput(null)}>
                <option value="" disabled>Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* Activity Level - Full Width */}
            <div style={{ ...styles.inputGroup, ...styles.fullWidth }}>
              <label htmlFor="activity_level" style={styles.label}>Activity Level (TDEE):</label>
              <select id="activity_level" name="activity_level" value={formData.activity_level} onChange={handleChange} style={getInputStyle('activity_level')} onFocus={() => setFocusedInput('activity_level')} onBlur={() => setFocusedInput(null)}>
                <option value="" disabled>Select Activity Level</option>
                <option value="sedentary">Sedentary (little or no exercise)</option>
                <option value="light">Lightly Active (1–3 days/week)</option>
                <option value="moderate">Moderately Active (3–5 days/week)</option>
                <option value="active">Very Active (6–7 days/week)</option>
                <option value="very_active">Extra Active (intense daily exercise)</option>
              </select>
            </div>

            {/* Neck */}
            <div style={styles.inputGroup}>
              <label htmlFor="neck" style={styles.label}>Neck (cm) (for Body Fat):</label>
              <input type="number" id="neck" name="neck" value={formData.neck} onChange={handleChange} placeholder="e.g., 38" style={getInputStyle('neck')} onFocus={() => setFocusedInput('neck')} onBlur={() => setFocusedInput(null)} />
            </div>

            {/* Waist */}
            <div style={styles.inputGroup}>
              <label htmlFor="waist" style={styles.label}>Waist (cm) (for Body Fat):</label>
              <input type="number" id="waist" name="waist" value={formData.waist} onChange={handleChange} placeholder="e.g., 85" style={getInputStyle('waist')} onFocus={() => setFocusedInput('waist')} onBlur={() => setFocusedInput(null)} />
            </div>

            {/* Hip (female only) */}
            <div style={styles.inputGroup}>
              <label htmlFor="hip" style={styles.label}>Hip (cm) (Females only):</label>
              <input type="number" id="hip" name="hip" value={formData.hip} onChange={handleChange} placeholder="e.g., 95" disabled={!isFemale} style={!isFemale ? { ...getInputStyle('hip'), ...styles.disabled } : getInputStyle('hip')} onFocus={() => setFocusedInput('hip')} onBlur={() => setFocusedInput(null)} />
            </div>

            {/* Goal */}
            <div style={styles.inputGroup}>
              <label htmlFor="goal" style={styles.label}>Your Goal:</label>
              <select id="goal" name="goal" value={formData.goal} onChange={handleChange} style={getInputStyle('goal')} onFocus={() => setFocusedInput('goal')} onBlur={() => setFocusedInput(null)}>
                <option value="maintenance">Maintenance</option>
                <option value="weight_loss">Weight Loss</option>
                <option value="muscle_gain">Muscle Gain</option>
              </select>
            </div>
          </div>
          
          {/* Pregnancy Section - Full Width */}
          {isFemale && (
            <div style={styles.fullWidth}>
              <hr style={styles.hrDashed} />
              <h3 style={styles.subHeading}>🤰 Pregnancy Information (Optional)</h3>
              <div style={styles.formGrid}>
                <div style={styles.inputGroup}>
                  <label htmlFor="pre_preg_weight" style={styles.label}>Pre-pregnancy Weight (kg):</label>
                  <input type="number" id="pre_preg_weight" name="pre_preg_weight" value={formData.pre_preg_weight} onChange={handleChange} style={getInputStyle('pre_preg_weight')} onFocus={() => setFocusedInput('pre_preg_weight')} onBlur={() => setFocusedInput(null)} />
                </div>

                <div style={styles.inputGroup}>
                  <label htmlFor="current_weight" style={styles.label}>Current Weight (kg):</label>
                  <input type="number" id="current_weight" name="current_weight" value={formData.current_weight} onChange={handleChange} style={getInputStyle('current_weight')} onFocus={() => setFocusedInput('current_weight')} onBlur={() => setFocusedInput(null)} />
                </div>

                <div style={{ ...styles.inputGroup, gridColumn: '1 / -1' }}>
                  <label htmlFor="trimester" style={styles.label}>Trimester:</label>
                  <select id="trimester" name="trimester" value={formData.trimester} onChange={handleChange} style={getInputStyle('trimester')} onFocus={() => setFocusedInput('trimester')} onBlur={() => setFocusedInput(null)}>
                    <option value="" disabled>Select Trimester</option>
                    <option value="first">First</option>
                    <option value="second">Second</option>
                    <option value="third">Third</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            style={isButtonHovered ? { ...styles.button, ...styles.buttonHover } : styles.button} 
            onMouseEnter={() => setIsButtonHovered(true)} 
            onMouseLeave={() => setIsButtonHovered(false)}
          >
            Calculate All Metrics
          </button>
        </form>

        {error && <p style={styles.error}>{error}</p>}

        {results && (
          <div style={styles.resultsContainer}>
            <h3 style={styles.resultsHeading}>🎯 Your Health Metrics</h3>
            <p style={styles.resultItem}>
              <strong style={styles.strong}>BMI:</strong> {results.bmi?.bmi} 
              (<span style={{ fontWeight: 'bold', color: categoryColors[results.bmi?.category] || '#333' }}>{results.bmi?.category}</span>)
            </p>
            <p style={styles.resultItem}><strong style={styles.strong}>BMR:</strong> {results.bmr} calories/day</p>
            <p style={styles.resultItem}><strong style={styles.strong}>TDEE (Daily Calorie Need):</strong> {results.tdee} calories/day</p>
            <p style={styles.resultItem}>
              <strong style={styles.strong}>Body Fat:</strong> {results.body_fat?.bf}% 
              (<span style={{ fontWeight: 'bold', color: categoryColors[results.body_fat?.category] || '#333' }}>{results.body_fat?.category}</span>)
            </p>
            <p style={styles.resultItem}><strong style={styles.strong}>Ideal Weight Range:</strong> {results.ideal_weight}</p>
            <p style={styles.resultItem}><strong style={styles.strong}>Nutrition Goal:</strong> {results.nutrition_guidance}</p>
            <p style={styles.resultItem}><strong style={styles.strong}>Goal Macros (Protein/Fat/Carbs):</strong> {results.macros}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthAndFitnessCalculator;