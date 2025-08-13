import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AppContext } from "../Context/AppContext.jsx";
import PDFViewer from "./PDFViewer";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";

const MedicalReport = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showPDF, setShowPDF] = useState(false);

  const { backendUrl, token } = useContext(AppContext);

  const getReports = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/user/my-reports`, {
        headers: { token },
      });

      if (response.data.success) {
        setReports(response.data.reports);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load reports");
    }
  };

  useEffect(() => {
    if (token) {
      getReports();
    }
  }, [token]);

  const downloadRecommendationPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(selectedReport.title, 10, 20);
    doc.setFontSize(12);
    doc.text(`Doctor: ${selectedReport.doctorName}`, 10, 30);
    doc.text(`Date: ${new Date(selectedReport.date).toLocaleDateString()}`, 10, 40);
    doc.text("Medical Recommendations:", 10, 50);
    doc.setFontSize(11);
    doc.text(selectedReport.medicines || "No recommendations provided.", 10, 60, { maxWidth: 180 });
    doc.save(`${selectedReport.title}-Recommendations.pdf`);
  };

  return (
    <div className="min-h-screen sm:min-h-[80vh] p-6 m-6 border rounded-lg border-teal-500 bg-gradient-to-br from-teal-50 to-blue-50">
      <h1 className="text-3xl font-bold mb-6 text-center text-teal-800">
        My Medical Reports
      </h1>

      {reports.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div
              key={report._id}
              onClick={() => {
                setSelectedReport(report);
                setShowPDF(false);
              }}
              className="bg-white p-5 rounded-xl shadow-md hover:shadow-xl cursor-pointer transition-all duration-300 border border-teal-200 hover:border-teal-400"
            >
              <h2 className="text-xl font-semibold text-teal-700">{report.title}</h2>
              <p className="text-sm text-teal-500">Date: {new Date(report.date).toLocaleDateString()}</p>
              <p className="text-sm text-teal-500">Doctor: {report.doctorName || "Doctor"}</p>
              <span className="text-green-600 font-medium text-sm">Verified</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-teal-400 mt-10 italic">No Medical Reports Available</p>
      )}

      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-8 relative max-h-[90vh] overflow-y-auto border-2 border-teal-400">
            <button
              onClick={() => setSelectedReport(null)}
              className="absolute top-4 right-4 text-3xl text-teal-600 hover:text-red-500 transition-all"
              aria-label="Close modal"
            >
              ✖
            </button>

            <h2 className="text-3xl font-bold text-teal-800 mb-3">{selectedReport.title}</h2>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 text-teal-700 text-md">
              <p>👨‍⚕️ Doctor: <span className="font-semibold">{selectedReport.doctorName}</span></p>
              <p className="mt-2 sm:mt-0">📅 Date: {new Date(selectedReport.date).toLocaleDateString()}</p>
            </div>

            <div className="border border-teal-300 bg-teal-100 p-5 rounded-lg shadow-inner mb-6">
              <h3 className="text-lg font-semibold text-teal-700 mb-2">📝 Medical Recommendations</h3>
              <p className="text-teal-700 whitespace-pre-wrap leading-relaxed">
                {selectedReport.medicines || "No recommendations provided."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
              <button
                onClick={() => setShowPDF(true)}
                className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto py-3 px-6 rounded-md text-white font-semibold tracking-wide transition-all"
              >
                📄 View Full Report PDF
              </button>

              <button
                onClick={downloadRecommendationPDF}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto py-3 px-6 rounded-md text-white font-semibold tracking-wide transition-all"
              >
                📥 Download Recommendations
              </button>
            </div>

            {showPDF && (
              <div className="mt-6 p-4 bg-white rounded-xl border-2 border-teal-300 shadow-inner">
                <div className="h-[65vh] overflow-y-scroll rounded-lg">
                  <PDFViewer file={`${backendUrl}${selectedReport.reportUrl}`} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalReport;
