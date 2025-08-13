import React, { useContext, useEffect, useState } from "react";
import { DoctorContext } from "../../Context/DoctorContext";
import { AppContext } from "../../Context/AppContext";
import { assets } from "../../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DoctorAppointment = () => {
  const {
    getappointment,
    appointment,
    dToken,
    completeAppointment,
    CancleAppointment,
  } = useContext(DoctorContext);

  const { calculateAge, slotDateFormat } = useContext(AppContext);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [selectedPatientName, setSelectedPatientName] = useState("");
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    if (dToken) {
      getappointment();
    }
  }, [dToken]);

  const handleWriteReport = (appointmentId, patientName) => {
    setSelectedAppointmentId(appointmentId);
    setSelectedPatientName(patientName);
    setIsReportModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
    } else {
      setFileName("");
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("appointmentId", selectedAppointmentId);
      formData.append("title", e.target.title.value);
      formData.append("medicines", e.target.medicines.value);
      formData.append("file", e.target.file.files[0]);

      const dtoken = localStorage.getItem('dToken');

      const response = await axios.post(
        "http://localhost:4000/api/doctor/upload-report",
        formData,
        { headers: { dtoken } }
      );

      if (response.data.success) {
        toast.success("Report uploaded successfully!");
        setIsReportModalOpen(false);
        setFileName("");
      } else {
        toast.error("Failed to upload report: " + response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error uploading report!");
    }
  };

  return (
    <div className="w-full max-w-6xl m-5">
      <p className="mb-3 text-lg font-medium">All Appointments</p>

      <div className="bg-white border border-gray-300 rounded text-sm max-h-[80vh] overflow-y-scroll min-h-[50vh]">
        <div className="max-sm:hidden grid grid-cols-[0.5fr_2fr_1.5fr_1fr_2fr_2fr_3fr] gap-1 py-3 px-6 border-b border-gray-300">
          <p>#</p>
          <p>Patient Details</p>
          <p>Cancellation Status</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Med Status</p>
          <p>Action</p>
        </div>

        {appointment.map((item, index) => (
          <div
            key={index}
            className="flex flex-wrap cursor-pointer justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1.5fr_1fr_2fr_2fr_3fr] gap-1 items-center text-gray-500 py-3 px-6 border-b border-gray-300 hover:bg-teal-50"
          >
            <p className="max-sm:hidden">{index + 1}</p>

            <div className="flex items-center gap-2">
              <img
                className="w-10 rounded-full"
                src={item.userData.image}
                alt=""
              />
              <p>{item.userData.name}</p>
            </div>

            <div>
              <p
                className={`max-sm:hidden ${item.cancelled ? "text-red-500" : "text-teal-500"}`}
              >
                {item.cancelled ? "Cancelled" : "Scheduled"}
              </p>
            </div>

            <p>{!isNaN(calculateAge(item.userData.dob)) ? calculateAge(item.userData.dob) : "N/A"}</p>

            <p>{slotDateFormat(item.slotDate)} <span className="text-red-500">|</span> {item.slotTime}</p>

            <p className={`max-sm:hidden ${item.isCompleted ? "text-teal-600" : "text-orange-500"}`}>
              {item.isCompleted ? "Completed" : "Pending"}
            </p>

            <div className="flex gap-3">
              {item.cancelled ? (
                item.isCompleted ? (
                  <p className="text-red-500 font-medium">Appointment Cancelled by patient</p>
                ) : (
                  <p className="text-red-500 font-medium">Appointment Cancelled by doctor</p>
                )
              ) : item.isCompleted ? (
                <button
                  className="px-4 cursor-pointer py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition"
                  onClick={() => handleWriteReport(item._id, item.userData.name)}
                >
                  Write Report
                </button>
              ) : (
                <>
                  <img
                    onClick={() => CancleAppointment(item._id)}
                    className="w-10 cursor-pointer"
                    src={assets.cancel_icon}
                    alt="Cancel"
                  />
                  <img
                    onClick={() => completeAppointment(item._id)}
                    className="w-10 cursor-pointer"
                    src={assets.tick_icon}
                    alt="Complete"
                  />
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Report Writing Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl relative">
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
              Write Report
            </h2>

            <form onSubmit={handleSubmitReport} className="flex flex-col gap-3">
              <div className="w-full flex flex-col text-gray-700 text-base gap-1">
                <label className="block" htmlFor="patient-name">Patient Name</label>
                <input
                  type="text"
                  id="patient-name"
                  value={selectedPatientName}
                  disabled
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none"
                />
              </div>

              <div className="w-full flex flex-col text-gray-700 text-base gap-1">
                <label className="block" htmlFor="report-title">Report Title</label>
                <input
                  type="text"
                  name="title"
                  id="report-title"
                  required
                  placeholder="Enter Report Title"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="w-full flex flex-col text-gray-700 text-base gap-1">
                <label className="block" htmlFor="medicines">Medicine Recommendations</label>
                <textarea
                  name="medicines"
                  id="medicines"
                  rows="3"
                  placeholder="Write Medicine Recommendations (optional)"
                  className="w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:border-teal-500"
                ></textarea>
              </div>

              <label
                htmlFor="report-upload"
                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-teal-500 rounded-lg cursor-pointer bg-gray-50"
              >
                <div className="flex flex-col items-center justify-center pt-4 pb-4">
                  <svg
                    className="w-8 h-8 mb-2 text-teal-500"
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
                  <p className="mb-1 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF only (Max 5MB)</p>
                </div>
                <input
                  type="file"
                  id="report-upload"
                  name="file"
                  accept="application/pdf"
                  required
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {fileName && (
                <p className="text-xs mt-1 text-teal-600 text-center">{fileName} selected</p>
              )}

              <div className="flex justify-between gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="w-full p-2 border-none cursor-pointer rounded-md bg-gray-400 hover:bg-gray-500 text-white text-base"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="w-full p-2 border-none cursor-pointer rounded-md bg-teal-500 hover:bg-teal-600 text-white text-base"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointment;
