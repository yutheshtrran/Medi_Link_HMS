import React, { useContext, useEffect, useState } from "react";
import { DoctorContext } from "../../Context/DoctorContext";
import { assets } from "../../assets/assets";
import { AppContext } from "../../Context/AppContext";
import Loader from "../../Components/Loader"; // Import the Loader component

const DoctorDashboard = () => {
  const {
    dashData,
    getDashData,
    dToken,
    CancleAppointment,
    completeAppointment,
  } = useContext(DoctorContext);
  const { slotDateFormat } = useContext(AppContext);

  const [loading, setLoading] = useState(true);  // Added loading state

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [selectedPatientName, setSelectedPatientName] = useState("");
  const [fileName, setFileName] = useState("");

  useEffect(() => {
  if (dToken) {
    setLoading(true); // Start loading
    const startTime = Date.now();

    getDashData().finally(() => {
      const elapsed = Date.now() - startTime;
      const minLoaderTime = 1500; // 1 second

      if (elapsed < minLoaderTime) {
        setTimeout(() => setLoading(false), minLoaderTime - elapsed);
      } else {
        setLoading(false);
      }
    });
  }
}, [dToken]);

  const handleWriteReport = (appointmentId, patientName) => {
    setSelectedAppointmentId(appointmentId);
    setSelectedPatientName(patientName);
    setIsReportModalOpen(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmitReport = (e) => {
    e.preventDefault();
    // Here, you would submit the form using selectedAppointmentId and form data
    alert(`Report submitted for ${selectedPatientName}`);
    setIsReportModalOpen(false);
    setFileName("");
  };

  if (loading) {
    return <Loader />;  // Show loader while loading
  }

  return (
    dashData && (
      <div className="m-5">
        {/* Dashboard Cards */}
        <div className="flex flex-wrap gap-3">
          {/* UI Boxes unchanged */}
          {[
            { label: "Appointments", value: dashData.appointments, icon: assets.appointments_icon, border: "green" },
            { label: "Patients", value: dashData.patients, icon: assets.patients_icon, border: "green" },
            { label: "Completed Today", value: dashData.completedAppointmentsToday, icon: assets.appointment_completed, border: "green" },
            { label: "Cancelled", value: dashData.cancelledAppointments, icon: assets.appointment_Cancel, border: "red" },
            { label: "Pending", value: dashData.pendingAppointments, icon: assets.appointment_pending, border: "yellow" },
            { label: "Today's Appointments", value: dashData.todayAppointments, icon: assets.appointment_today, border: "teal" },
            { label: "Average Rating", value: `${dashData.averageRating} / 5`, icon: assets.ratings, border: "yellow" },
          ].map((box, i) => (
            <div key={i} className={`flex item-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-${box.border}-500 cursor-pointer hover:scale-105 transition-all`}>
              <img className="w-14" src={box.icon} alt={box.label} />
              <div>
                <p className="text-xl font-semibold text-gray-600">{box.value}</p>
                <p className="text-gray-400">{box.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Latest Appointments */}
        <div className="bg-white">
          <div className="flex items-center gap-2.5 px-4 py-4 mt-10 rounded-t border border-green-500">
            <img src={assets.list_icon} alt="List icon" className="w-8 h-8" />
            <p className="font-semibold text-gray-600">Latest Appointment Bookings</p>
          </div>

          <div className="py-4 border border-green-500 border-t-0">
            {dashData.latestAppointments.map((item, index) => (
              <div
                key={index}
                className="flex cursor-pointer items-center px-4 py-3 gap-3 hover:bg-blue-50"
              >
                <img className="rounded-full w-12" src={item.userData.image} alt="" />
                <div className="flex-1 text-sm">
                  <p className="text-gray-800">{item.userData.name}</p>
                  <p className="text-gray-500">{slotDateFormat(item.slotDate)}</p>
                </div>

                {item.cancelled ? (
                  item.isCompleted ? (
                    <p className="text-red-500 text-sm font-medium">
                      Appointment Cancelled by patient
                    </p>
                  ) : (
                    <p className="text-red-500 text-sm font-medium">
                      Appointment Cancelled by doctor
                    </p>
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
            ))}
          </div>
        </div>

        {/* Report Modal */}
        {isReportModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl relative">
              <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
                Write Report
              </h2>
              <form onSubmit={handleSubmitReport} className="flex flex-col gap-3">
                <div className="flex flex-col text-gray-700 text-base gap-1">
                  <label htmlFor="patient-name">Patient Name</label>
                  <input
                    type="text"
                    id="patient-name"
                    value={selectedPatientName}
                    disabled
                    className="p-2 border border-gray-300 rounded-md bg-gray-100"
                  />
                </div>

                <div className="flex flex-col text-gray-700 text-base gap-1">
                  <label htmlFor="report-title">Report Title</label>
                  <input
                    type="text"
                    name="title"
                    id="report-title"
                    required
                    placeholder="Enter Report Title"
                    className="p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="flex flex-col text-gray-700 text-base gap-1">
                  <label htmlFor="medicines">Medicine Recommendations</label>
                  <textarea
                    name="medicines"
                    id="medicines"
                    rows="3"
                    placeholder="Write Medicine Recommendations (optional)"
                    className="p-2 border border-gray-300 rounded-md resize-none"
                  ></textarea>
                </div>

                <label
                  htmlFor="report-upload"
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-teal-500 rounded-lg cursor-pointer bg-gray-50"
                >
                  <div className="flex flex-col items-center justify-center pt-4 pb-4">
                    <svg
                      className="w-8 h-8 mb-2 text-teal-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16l4-4m0 0l4 4m-4-4v10m10-2a4 4 0 004-4V4a4 4 0 00-4-4H7a4 4 0 00-4 4v12a4 4 0 004 4h10z" />
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
                  <p className="text-xs text-teal-600">Selected File: {fileName}</p>
                )}

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  );
};

export default DoctorDashboard;
