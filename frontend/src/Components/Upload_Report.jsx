import React, { useState, useMemo } from 'react';
import { RefreshCw, FileText, Activity, X, Upload } from 'lucide-react';

const FLASK_API_URL = 'http://localhost:5005/analyze-report-file';
const GEMINI_URL = 'https://gemini.example.com';

// Define keyword-color categories
const COLOR_CATEGORIES = {
  medicines: { keywords: ['medication', 'aspirin', 'statin', 'clopidogrel', 'drug', 'treatment'], color: 'text-green-600' },
  warnings: { keywords: ['warning', 'caution', 'risk', 'high blood pressure', 'allergy'], color: 'text-yellow-500' },
  severe: { keywords: ['acute coronary syndrome', 'heart attack', 'NSTEMI', 'critical', 'emergency'], color: 'text-red-600' },
  scans: { keywords: ['ECG', 'troponin', 'angiogram', 'scan', 'test', 'follow-up'], color: 'text-blue-600' }
};

// Convert **bold** markers to real bold text
const parseBoldMarkers = (text) => {
  const parts = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(<span className="font-bold" key={lastIndex}>{match[1]}</span>);
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
};

// Highlight keywords by color
const highlightKeywords = (text) => {
  const segments = [];
  let remaining = text;

  while (remaining.length > 0) {
    let match = null;
    let matchedCategory = null;

    Object.entries(COLOR_CATEGORIES).forEach(([_, { keywords, color }]) => {
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        const found = remaining.match(regex);
        if (found && (!match || found.index < match.index)) {
          match = found;
          matchedCategory = color;
        }
      });
    });

    if (!match) {
      segments.push(remaining);
      break;
    }

    if (match.index > 0) segments.push(remaining.slice(0, match.index));
    segments.push(<span className={matchedCategory} key={segments.length}>{match[0]}</span>);
    remaining = remaining.slice(match.index + match[0].length);
  }

  return segments;
};

// ✅ Detect if text is health-related
const isMedicalContent = (text) => {
  const medicalKeywords = [
    'diagnosis', 'treatment', 'disease', 'prescription', 'medicine', 'doctor',
    'hospital', 'patient', 'cardiology', 'ECG', 'blood pressure', 'cholesterol',
    'scan', 'MRI', 'symptom', 'injury', 'surgery', 'clinical', 'infection'
  ];
  const match = medicalKeywords.some(keyword =>
    new RegExp(`\\b${keyword}\\b`, 'i').test(text)
  );
  return match;
};

// Generate patient-focused narrative
const generatePatientNarrative = (summary, name) => {
  const greeting = name ? `Hi ${name}, here is a summary of your medical report:` : 'Here is a summary of your medical report:';
  const lines = summary.split('\n').map(l => l.trim()).filter(Boolean);
  const replacedLines = name
    ? lines.map(line => line.replace(new RegExp(name, 'gi'), 'you'))
    : lines;
  return [greeting, ...replacedLines].join('\n');
};

const Upload_Report = () => {
  const [file, setFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAppOpen, setIsAppOpen] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
    setAnalysisResult(null);
  };

  const analyzeFile = async () => {
    if (!file) {
      setError('Please select a file to analyze.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setIsExpanded(false);

    try {
      const formData = new FormData();
      formData.append('reportFile', file);

      const response = await fetch(FLASK_API_URL, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`API request failed with status: ${response.status}`);

      const result = await response.json();
      if (!result.summary || !result.summary.trim()) {
        window.location.href = GEMINI_URL;
        return;
      }

      // ✅ Check for medical context
      if (!isMedicalContent(result.summary)) {
        setAnalysisResult({
          text: "👋 I'm MedLink. I can only analyze health or medical-related documents. Please upload a valid medical report."
        });
        setIsLoading(false);
        return;
      }

      const patientNarrative = generatePatientNarrative(result.summary, result.name);
      setAnalysisResult({ text: patientNarrative });
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(`File analysis failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderLineWithColors = (line, idx) => {
    const boldParts = parseBoldMarkers(line);
    const parts = [];
    boldParts.forEach((part) => {
      if (typeof part === 'string') parts.push(...highlightKeywords(part));
      else parts.push(part);
    });
    return <p key={idx} className="text-gray-700 leading-relaxed text-base mb-2">{parts}</p>;
  };

  // ✅ Centered summary box
  const renderAnalysis = useMemo(() => {
    if (!analysisResult) return null;
    const lines = analysisResult.text.split('\n').map(line => line.trim()).filter(line => line);
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="bg-white border border-emerald-200 shadow-2xl rounded-2xl p-6 sm:p-8 w-full max-w-3xl max-h-[75vh] overflow-y-auto">
          <h3 className="text-xl font-semibold text-emerald-700 mb-4 text-center">
            🩺 Detailed Medical Report Summary
          </h3>
          {lines.map((line, idx) => renderLineWithColors(line, idx))}
          <div className="text-center mt-6">
            <button
              onClick={() => setAnalysisResult(null)}
              className="px-6 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }, [analysisResult]);

  const BottomBar = () => (
    <div
      onClick={() => setIsExpanded(true)}
      className="fixed bottom-0 left-0 right-0 bg-emerald-600 text-white p-3 cursor-pointer shadow-2xl transition duration-300 hover:bg-emerald-700 z-50 rounded-t-xl mx-auto max-w-sm mb-0 sm:mb-4"
    >
      <div className="flex items-center justify-center space-x-2">
        <FileText className="w-5 h-5" />
        <span className="font-semibold text-base">Upload Report File</span>
      </div>
    </div>
  );

  const InputOverlay = () => (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 sm:p-8 transform transition-all duration-300 ease-in-out">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Upload className="w-5 h-5 mr-2 text-emerald-500" />
            Upload Report File
          </h2>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            aria-label="Close input"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Please upload your medical report (PDF, TXT, or Image). The system will extract and summarize health-related insights.
        </p>

        <input
          type="file"
          accept=".txt,.pdf,image/*"
          onChange={handleFileChange}
          className="w-full mb-4"
        />

        {error && <div className="bg-red-100 text-red-700 p-3 rounded-xl border border-red-300 mt-2">{error}</div>}

        <div className="flex justify-end mt-4">
          <button
            onClick={analyzeFile}
            disabled={!file || isLoading}
            className="flex items-center px-6 py-3 bg-emerald-600 text-white font-semibold rounded-full shadow-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Activity className="w-5 h-5 mr-2" />
                Analyze File
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (!isAppOpen) {
    return (
      <div style={{ position: 'fixed', bottom: '25px', right: '25px', zIndex: 1000 }}>
        <button
          onClick={() => setIsAppOpen(true)}
          style={{
            backgroundColor: '#10B981',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '65px',
            height: '65px',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.5), 0 6px 12px rgba(0,0,0,0.25)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            transition: 'all 0.3s ease-in-out',
            animation: 'pulse-emerald 2s infinite'
          }}
          aria-label="Open Report Analyzer"
        >
          <Activity className="w-8 h-8" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-xl overflow-y-auto font-['Inter'] z-40">
      <div className="max-w-4xl mx-auto p-4 sm:p-8 pb-24 bg-white min-h-full shadow-2xl rounded-lg">
        <header className="text-center mb-10 relative">
          <button
            onClick={() => setIsAppOpen(false)}
            className="absolute top-0 right-0 p-2 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition"
            aria-label="Minimize"
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-4xl font-extrabold text-emerald-800 tracking-tight mb-2">
            <Activity className="inline-block w-8 h-8 mr-2 text-emerald-600" />
            Health Report Analyzer
          </h1>
          <p className="text-gray-500 text-xl">
            Upload a report file to extract key disease-level insights.
          </p>
        </header>

        {(analysisResult || isLoading) && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl border border-emerald-200">
            {isLoading && (
              <div className="flex items-center justify-center p-10 text-emerald-600">
                <RefreshCw className="w-6 h-6 mr-3 animate-spin" />
                Analyzing report...
              </div>
            )}
            {!isLoading && analysisResult && renderAnalysis}
          </div>
        )}

        {!analysisResult && !isLoading && (
          <div className="text-center p-12 bg-white rounded-2xl shadow-md border border-gray-200 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No report analyzed yet. Click the bar below to get started.</p>
          </div>
        )}
      </div>

      {isExpanded ? <InputOverlay /> : <BottomBar />}
    </div>
  );
};

export default Upload_Report;
