import React, { useState, useCallback, useMemo } from 'react';
import { RefreshCw, FileText, Activity, X } from 'lucide-react';

// --- LLM API Configuration and Utilities ---

// Constants for exponential backoff
const MAX_RETRIES = 5;
const INITIAL_DELAY_MS = 1000;
const apiKey = ""; // Leave as empty string for Canvas to provide
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

/**
 * Custom fetch wrapper with exponential backoff for resilience against transient errors.
 */
const fetchWithBackoff = async (apiUrl, options, retries = 0) => {
    try {
        const response = await fetch(apiUrl, options);
        if (response.status === 429 && retries < MAX_RETRIES) {
            const delay = INITIAL_DELAY_MS * Math.pow(2, retries);
            console.warn(`Rate limit hit (429). Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithBackoff(apiUrl, options, retries + 1);
        }
        if (!response.ok) {
            throw new Error(`API request failed with status: ${response.status}`);
        }
        return response;
    } catch (error) {
        if (retries < MAX_RETRIES) {
            const delay = INITIAL_DELAY_MS * Math.pow(2, retries);
            console.warn(`Fetch error. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithBackoff(apiUrl, options, retries + 1);
        }
        throw new Error(`Failed to fetch after ${MAX_RETRIES} attempts: ${error.message}`);
    }
};

// --- React Component ---

const App = () => {
    const [reportText, setReportText] = useState('');
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false); // Controls the input overlay within the app
    const [isAppOpen, setIsAppOpen] = useState(false); // Controls the main application window

    // System instruction for the AI model
    const systemInstruction = {
        parts: [{
            text: "You are an expert medical report summarizer and triage assistant. Analyze the provided patient report text, identify any results, abnormal values (if visible), or key findings that warrant immediate attention. If no issues are immediately obvious, state that. Do not provide medical advice or diagnosis. Format your output clearly under two main headings: '1. Summary of Key Findings' and '2. Suggested Areas for Doctor Review'. Use Markdown formatting, including bullet points under the headings."
        }]
    };

    // Handler for the core AI analysis
    const analyzeReport = useCallback(async () => {
        if (!reportText.trim()) {
            setError('Please paste the text of a medical report to analyze.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        setIsExpanded(false); // Collapse the input overlay when analysis starts

        const payload = {
            contents: [{ parts: [{ text: reportText }] }],
            systemInstruction: systemInstruction,
        };

        try {
            const response = await fetchWithBackoff(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            const candidate = result.candidates?.[0];

            if (candidate && candidate.content?.parts?.[0]?.text) {
                const text = candidate.content.parts[0].text;
                setAnalysisResult({ text });
            } else {
                setError('AI analysis failed to return a valid response.');
            }

        } catch (err) {
            console.error('LLM API Error:', err);
            setError(`Could not connect to the analysis service. Details: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [reportText]);

    // Simple markdown rendering utility
    const renderAnalysis = useMemo(() => {
        if (!analysisResult) return null;
        
        // This process converts basic markdown structures (headers, lists) into React elements
        const processText = analysisResult.text.split('\n').map((line, index) => {
            if (line.startsWith('1.') || line.startsWith('2.')) {
                return <h3 key={index} className="text-xl font-bold text-emerald-700 mt-4 mb-2">{line}</h3>;
            }
            if (line.trim().startsWith('*')) {
                // Use a simple list for bullet points
                return <li key={index} className="ml-5 list-disc text-gray-700 text-base leading-relaxed">{line.substring(1).trim()}</li>;
            }
            if (line.trim() === '') {
                return <br key={index} />;
            }
            return <p key={index} className="text-gray-700 leading-relaxed text-base">{line}</p>;
        });

        // Wrap list items in a <ul> if they exist
        let inList = false;
        const renderedElements = [];
        let currentList = [];

        processText.forEach((el, index) => {
            if (React.isValidElement(el) && el.type === 'li') {
                currentList.push(el);
                if (!inList) inList = true;
            } else {
                if (inList) {
                    renderedElements.push(<ul key={`list-${index}`} className="mb-4 pl-0">{currentList}</ul>);
                    currentList = [];
                    inList = false;
                }
                renderedElements.push(el);
            }
        });
        if (inList) {
             renderedElements.push(<ul key={`list-final`} className="mb-4 pl-0">{currentList}</ul>);
        }

        return (
            <div className="p-4 bg-white rounded-xl shadow-inner mt-6 border border-gray-100">
                {renderedElements}
            </div>
        );
    }, [analysisResult]);

    // 1. Collapsed Bottom Bar Component (Visible only when the main app is open, controls the input overlay)
    const BottomBar = () => (
        <div 
            onClick={() => setIsExpanded(true)}
            className="fixed bottom-0 left-0 right-0 bg-emerald-600 text-white p-4 cursor-pointer shadow-2xl transition duration-300 ease-in-out hover:bg-emerald-700 z-50 rounded-t-xl mx-auto max-w-lg mb-4 transform hover:scale-[1.01] active:scale-[0.99]"
        >
            <div className="flex items-center justify-center space-x-2">
                <FileText className="w-5 h-5" />
                <span className="font-semibold text-lg">Upload/Paste Report Here</span>
            </div>
        </div>
    );

    // 2. Expanded Input Overlay Component (Controls data input)
    const InputOverlay = () => (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-[60] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl p-6 sm:p-8 transform transition-all duration-300 ease-in-out scale-100 opacity-100">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-emerald-500" />
                        Paste or Type Report Text
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
                    Please paste the contents of your medical report below. **Do not include any sensitive personal identifiers like your name or address.**
                </p>

                <textarea
                    className="w-full h-64 p-4 border-2 border-dashed border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 ease-in-out text-gray-700 resize-none placeholder:text-gray-400"
                    placeholder="Example: 'Patient: J. Doe. Date: 2025-10-01. Test: Complete Blood Count. White Blood Cell Count: 12.5 K/uL (High). Hemoglobin: 14.2 g/dL (Normal). Platelets: 280 K/uL (Normal). Conclusion: Findings suggest mild inflammatory response.'"
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    disabled={isLoading}
                />

                {error && isExpanded && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-xl border border-red-300 mt-4">
                        <p className="font-semibold">Error:</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <div className="flex justify-end mt-4">
                    <button
                        onClick={analyzeReport}
                        disabled={isLoading || !reportText.trim()}
                        className="flex items-center px-6 py-3 bg-emerald-600 text-white font-semibold rounded-full shadow-lg hover:bg-emerald-700 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01] active:scale-[0.99]"
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Analyzing Report...
                            </>
                        ) : (
                            <>
                                <Activity className="w-5 h-5 mr-2" />
                                Find Issues Now
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    // If the application is minimized, show only the floating button
    if (!isAppOpen) {
        // Custom CSS for the glow animation (emerald-600 is roughly #059669)
        return (
            <>
                <style>{`
                    @keyframes pulse-emerald {
                        0% {
                            box-shadow: 0 0 0 0 rgba(5, 150, 105, 0.7);
                        }
                        70% {
                            box-shadow: 0 0 0 16px rgba(5, 150, 105, 0);
                        }
                        100% {
                            box-shadow: 0 0 0 0 rgba(5, 150, 105, 0);
                        }
                    }
                `}</style>
                <button 
                    onClick={() => setIsAppOpen(true)}
                    className="fixed bottom-8 right-8 z-50 p-4 bg-emerald-600 text-white rounded-full shadow-2xl transition duration-300 hover:bg-emerald-700 transform hover:scale-105"
                    style={{ animation: 'pulse-emerald 2s infinite' }}
                    aria-label="Open Health Report Analyzer"
                >
                    <Activity className="w-8 h-8" />
                </button>
            </>
        );
    }

    // If the application is open, show the full interface as a fixed overlay
    return (
        <div className="fixed inset-0 bg-gray-50 overflow-y-auto p-4 sm:p-8 font-['Inter'] z-40 shadow-2xl">
            <div className="max-w-4xl mx-auto pb-24"> 
                {/* Header with Close Button */}
                <header className="text-center mb-10 relative">
                    <button 
                        onClick={() => setIsAppOpen(false)}
                        className="absolute top-2 right-0 p-2 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition"
                        aria-label="Minimize"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <h1 className="text-4xl font-extrabold text-emerald-800 tracking-tight mb-2">
                        <Activity className="inline-block w-8 h-8 mr-2 text-emerald-600" />
                        Health Report Triage Assistant
                    </h1>
                    <p className="text-gray-500 text-xl">
                        Quickly find the key findings in your report before your doctor appointment.
                    </p>
                </header>

                {/* Analysis Card */}
                {(analysisResult || isLoading) && (
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl border border-emerald-200">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            AI Summary & Triage
                        </h2>
                        {isLoading && (
                            <div className="flex items-center justify-center p-10 text-emerald-600">
                                <RefreshCw className="w-6 h-6 mr-3 animate-spin" />
                                <span className="text-lg font-medium">Analyzing report, please wait...</span>
                            </div>
                        )}
                        {error && !isExpanded && ( // Show non-input errors here
                             <div className="bg-red-100 text-red-700 p-4 rounded-xl border border-red-300">
                                <p className="font-semibold">Error:</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}
                        {!isLoading && analysisResult && renderAnalysis}
                        <p className="mt-6 text-sm text-gray-400 italic">
                            Disclaimer: This analysis is **AI-generated** and for informational purposes only, designed to help you prepare for your appointment. It is **not** a substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare professional.
                        </p>
                    </div>
                )}

                {!analysisResult && !isLoading && (
                    <div className="text-center p-12 bg-white rounded-2xl shadow-md border border-gray-200 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No report analyzed yet. Click the bar below to get started.</p>
                    </div>
                )}
            </div>

            {/* Conditional Display of Input/Bottom Bar */}
            {isExpanded ? <InputOverlay /> : <BottomBar />}
        </div>
    );
};

export default App;
