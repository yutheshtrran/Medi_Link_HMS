import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

// Base URL for the Flask backend API
const API_BASE_URL = 'http://127.0.0.1:5005';

const ChartNavigator = () => {
  const [activeChart, setActiveChart] = useState('awareness');
  const [diseasePrevalence, setDiseasePrevalence] = useState([]);
  const [awarenessRates, setAwarenessRates] = useState([]);
  const [consultationRates, setConsultationRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF0054', '#8884d8', '#DEB887', '#5F9EA0', '#D2691E'];
  const UNAWARE_COLOR = '#ccc';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const responses = await Promise.all([
          fetch(`${API_BASE_URL}/api/statistics/disease_prevalence`),
          fetch(`${API_BASE_URL}/api/statistics/awareness_rates`),
          fetch(`${API_BASE_URL}/api/statistics/consultation_rates`),
        ]);

        const data = await Promise.all(responses.map(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        }));

        setDiseasePrevalence(data[0]);
        setAwarenessRates(data[1].sort((a, b) => b.aware - a.aware));
        setConsultationRates(data[2]);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Failed to load data. Please check the backend server and network connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChartChange = (chartType) => setActiveChart(chartType);

  // Button styles without pseudo-classes (hover handled via CSS)
  const styles = {
    container: {
      fontFamily: '"Inter", sans-serif',
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: '#f9f9f9',
      borderRadius: '12px',
      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
    },
    header: {
      textAlign: 'center',
      color: '#333',
      marginBottom: '30px',
      fontSize: '2.2em',
      fontWeight: 'bold',
    },
    buttonContainer: {
      textAlign: 'center',
      marginBottom: '30px',
      display: 'flex',
      justifyContent: 'center',
      gap: '15px',
      flexWrap: 'wrap',
    },
    button: {
      padding: '12px 25px',
      border: 'none',
      borderRadius: '8px',
      backgroundColor: '#00C49F',
      color: 'white',
      fontSize: '17px',
      cursor: 'pointer',
      fontWeight: '600',
      outline: 'none',
      transition: 'background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease',
    },
    buttonActive: {
      backgroundColor: '#008C75',
      boxShadow: 'inset 0 2px 5px rgba(0, 0, 0, 0.3)',
      transform: 'translateY(0)',
    },
    chartContainer: {
      backgroundColor: '#fff',
      padding: '25px',
      borderRadius: '12px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.08)',
      height: '700px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingMessage: {
      textAlign: 'center',
      fontSize: '20px',
      color: '#555',
      padding: '50px',
      fontWeight: 'bold',
    },
    errorMessage: {
      textAlign: 'center',
      fontSize: '20px',
      color: '#d9534f',
      padding: '50px',
      fontWeight: 'bold',
    },
    chartTitle: {
      textAlign: 'center',
      marginBottom: '25px',
      color: '#555',
      fontSize: '24px',
      fontWeight: 'bold',
    },
    tooltipContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      border: '1px solid #ddd',
      padding: '12px',
      borderRadius: '8px',
      fontSize: '15px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
    },
    tooltipItem: {
      margin: '6px 0',
      color: '#333',
      lineHeight: '1.4',
    },
    legendContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginTop: '30px',
      padding: '15px',
      borderTop: '1px solid #eee',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      margin: '8px 20px',
      fontSize: '15px',
      color: '#333',
      fontWeight: '500',
    },
    legendColorBox: {
      width: '14px',
      height: '14px',
      borderRadius: '4px',
      marginRight: '10px',
      border: '1px solid rgba(0,0,0,0.1)',
    },
  };

  const getButtonStyle = (chartType) => {
    return activeChart === chartType
      ? { ...styles.button, ...styles.buttonActive }
      : styles.button;
  };

  // Custom Tooltip for Awareness chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const hoveredData = payload[0].payload;
      if (!hoveredData) return null;

      const diseaseName = hoveredData.name;
      const awarePercent = hoveredData.awarePercent;
      const unawarePercent = hoveredData.unawarePercent;

      // Find color for aware segment dynamically
      const colorIndex = awarenessRates.findIndex(d => d.name === diseaseName);
      const awareColor = PIE_COLORS[colorIndex % PIE_COLORS.length];

      return (
        <div style={styles.tooltipContainer}>
          <p style={styles.tooltipItem}><strong>{diseaseName}</strong></p>
          <p style={styles.tooltipItem}>
            Aware: <span style={{ color: awareColor }}>{awarePercent}%</span>
          </p>
          <p style={styles.tooltipItem}>
            Unaware: <span style={{ color: UNAWARE_COLOR }}>{unawarePercent}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom Legend for Awareness chart
  const CustomLegend = () => {
    const uniqueDiseases = awarenessRates.map((entry, index) => ({
      name: entry.name,
      color: PIE_COLORS[index % PIE_COLORS.length],
    }));

    return (
      <div style={styles.legendContainer}>
        {uniqueDiseases.map((disease, index) => (
          <div key={`legend-disease-${index}`} style={styles.legendItem}>
            <div style={{ ...styles.legendColorBox, backgroundColor: disease.color }}></div>
            {disease.name}
          </div>
        ))}
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendColorBox, backgroundColor: UNAWARE_COLOR }}></div>
          Unaware (Common for all)
        </div>
      </div>
    );
  };

  if (loading) {
    return <div style={styles.loadingMessage}>Loading charts...</div>;
  }

  if (error) {
    return <div style={styles.errorMessage}>Error: {error}</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Health Statistics Dashboard</h2>

      <div style={styles.buttonContainer}>
        <button
          style={getButtonStyle('prevalence')}
          onClick={() => handleChartChange('prevalence')}
        >
          Disease Prevalence
        </button>
        <button
          style={getButtonStyle('awareness')}
          onClick={() => handleChartChange('awareness')}
        >
          Awareness Rates
        </button>
        <button
          style={getButtonStyle('consultation')}
          onClick={() => handleChartChange('consultation')}
        >
          Consultation Rates
        </button>
      </div>

      <div style={styles.chartContainer}>
        {activeChart === 'prevalence' && (
          <>
            <h3 style={styles.chartTitle}>Top Diseases by Cases (2023-2024)</h3>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                data={diseasePrevalence.slice().sort((a, b) => b.cases - a.cases).slice(0, 10)}
                margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cases" fill="#8884d8" name="Cases" />
                <Bar dataKey="deaths" fill="#82ca9d" name="Deaths" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {activeChart === 'awareness' && (
          <>
            <h3 style={styles.chartTitle}>Public Awareness vs. Unawareness</h3>
            <ResponsiveContainer width="100%" height="90%">
              <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
                {awarenessRates.map((entry, index) => {
                  const awarePercentage = entry.aware;
                  const unawarePercentage = entry.unaware;
                  const pieData = [
                    {
                      name: entry.name,
                      value: awarePercentage,
                      type: 'aware',
                      awarePercent: awarePercentage,
                      unawarePercent: unawarePercentage,
                    },
                    {
                      name: entry.name,
                      value: unawarePercentage,
                      type: 'unaware',
                      awarePercent: awarePercentage,
                      unawarePercent: unawarePercentage,
                    },
                  ];

                  return (
                    <Pie
                      key={`pie-${index}`}
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      outerRadius={80 + index * 15}
                      innerRadius={60 + index * 15}
                      dataKey="value"
                      isAnimationActive={false}
                    >
                      <Cell fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      <Cell fill={UNAWARE_COLOR} />
                    </Pie>
                  );
                })}
                <Tooltip content={<CustomTooltip />} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </>
        )}

        {activeChart === 'consultation' && (
          <>
            <h3 style={styles.chartTitle}>Daily Consultation Rates</h3>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart
                data={consultationRates.map((rate, index) => ({ day: `Day ${index + 1}`, rate }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="rate" fill="#a4de6c" name="Consultations" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
};

export default ChartNavigator;
