import React, { useContext, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

const VerifyDoctor = () => {
  const [certificateId, setCertificateId] = useState("");
  const [certificateFile, setCertificateFile] = useState(null);

  const handleCertificateChange = (e) => {
    setCertificateFile(e.target.files[0]);
  };

  const handleCertificateSubmit = async (e) => {
    e.preventDefault();

    if (!certificateFile || !certificateId) {
      toast.warning("Please upload a certificate and enter the Certificate ID.");
      return;
    }

    const formData = new FormData();
    formData.append("certificate", certificateFile);
    formData.append("certificateId", certificateId);

    try {
      const dtoken = localStorage.getItem("dToken");

      const { data } = await axios.post(
        "http://localhost:4000/api/doctor/verify-certificate",
        formData,
        { headers: { dtoken } }
      );

      if (data.success) {
        toast.success("Certificate submitted successfully.");
        setCertificateFile(null);
        setCertificateId("");
      } else {
        toast.error(data.message || "Submission failed.");
      }
    } catch (error) {
      console.error("Submit Error:", error);
      toast.error("Server error during certificate submission.");
    }
  };

  return (
    <div className="min-h-fit w-full flex flex-col items-start p-5">
      <p className="mb-3 text-lg font-medium text-teal-800">
        <span className="text-teal-600">Verify</span> your Certificate
      </p>

      <form
        onSubmit={handleCertificateSubmit}
        className="flex flex-col items-center gap-6 justify-center w-full md:w-1/2"
      >
        <label
          htmlFor="certificate-upload"
          className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-teal-500 rounded-lg cursor-pointer bg-teal-50 hover:bg-teal-100 transition"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-5">
            <svg
              className="w-8 h-8 mb-4 text-teal-600"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 16"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
              />
            </svg>

            <p className="mb-2 text-sm text-teal-700">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-teal-500">PDF, JPG, PNG (Max 5MB)</p>
          </div>

          <input
            type="file"
            accept=".pdf,image/*"
            onChange={handleCertificateChange}
            id="certificate-upload"
            className="hidden"
          />
        </label>

        <div className="w-full gap-2 flex flex-col text-teal-800 text-base">
          <label className="block font-medium" htmlFor="cert-id">
            Certificate ID
          </label>
          <input
            type="text"
            value={certificateId}
            onChange={(e) => setCertificateId(e.target.value)}
            className="w-full p-2 border border-teal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Enter your Certificate ID"
            id="cert-id"
          />
        </div>

        <button
          type="submit"
          className="w-full p-2 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-base font-medium transition-colors"
        >
          Submit Certificate for Verification
        </button>
      </form>
    </div>
  );
};

export default VerifyDoctor;
