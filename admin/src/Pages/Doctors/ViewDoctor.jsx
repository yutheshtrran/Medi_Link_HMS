import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { DoctorContext } from "../../Context/DoctorContext";

function ViewDoctor() {
  const { backendURL, dToken } = useContext(DoctorContext);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!backendURL || !dToken) {
        toast.error("Missing credentials. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${backendURL}/api/doctor/profile`, {
          headers: { Authorization: `Bearer ${dToken}` },
        });

        const data = response?.data;
        if (data?.success && data?.doctor) {
          setDoctor(data.doctor);
          toast.success("Doctor profile loaded successfully!");
        } else {
          toast.error(data?.message || "Failed to fetch profile.");
          setDoctor(null);
        }
      } catch (error) {
        console.error("Axios error fetching doctor profile:", error);
        toast.error("Error loading profile. Showing sample data.");

        // Fallback mock data
        setDoctor({
          name: "Dr. Jane Smith (Mock Data)",
          degree: "MBBS, MD (Dermatology)",
          university: "Oceanic Medical University",
          speciality: "Dermatology",
          mobile: "555-987-6543",
          experience: "8 years",
          address: {
            line1: "456 Health Avenue, Building 3",
            line2: "Teal City, Country 67890",
          },
          about:
            "This is a mock profile shown because the backend API could not be reached.",
          image: "https://placehold.co/288x350/0d9488/ffffff?text=Doctor",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, [backendURL, dToken]);

  if (loading)
    return (
      <div className="m-5 text-center p-10 bg-white shadow-lg rounded-lg border border-teal-200">
        <p className="text-xl text-teal-600 font-semibold">
          Loading doctor profile... ⏳
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Please wait while we fetch your data.
        </p>
      </div>
    );

  const docInfo = doctor || {};
  const addressInfo = docInfo.address || {};
  const imageSrc =
    docInfo.image || "https://placehold.co/288x350/0d9488/ffffff?text=Doctor";

  return (
    <div className="p-4 sm:p-8 bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 min-h-screen">
      <h2 className="text-3xl font-bold text-teal-700 mb-6 border-b-4 border-teal-300 inline-block pb-2">
        My Profile
      </h2>

      <div className="flex flex-col sm:flex-row gap-8 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-teal-200">
        {/* Doctor Image */}
        <div className="flex-shrink-0">
          <img
            className="w-full sm:max-w-72 h-auto rounded-2xl shadow-md object-cover ring-4 ring-teal-200"
            src={imageSrc}
            alt={docInfo.name || "Doctor Profile"}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                "https://placehold.co/288x350/99f6e4/0f766e?text=Image+Not+Found";
            }}
          />
        </div>

        {/* Doctor Details */}
        <div className="flex-1 bg-gradient-to-br from-white to-teal-50 border border-teal-200 rounded-2xl p-8 shadow-sm">
          <p className="text-3xl font-extrabold text-teal-700 mb-4">
            {docInfo.name || "Doctor Name N/A"}
          </p>

          <div className="text-base text-gray-700 space-y-2">
            <DetailItem label="Degree" value={docInfo.degree} />
            <DetailItem label="University" value={docInfo.university} />
            <DetailItem label="Specialized" value={docInfo.speciality} isAccent />
            <DetailItem label="Experience" value={docInfo.experience} />
            <div className="pt-2">
              <DetailItem label="Contact Mobile" value={docInfo.mobile} />
            </div>

            {docInfo.address && (
              <div className="pt-2">
                <span className="font-semibold text-teal-700 block">Address:</span>
                <p className="ml-4 text-sm text-gray-600">
                  {addressInfo.line1 || "N/A"}
                </p>
                <p className="ml-4 text-sm text-gray-600">
                  {addressInfo.line2 || "N/A"}
                </p>
              </div>
            )}
          </div>

          {/* About Section */}
          <div className="mt-6 pt-4 border-t border-teal-200">
            <p className="text-lg font-bold text-teal-800 mb-2">About Me</p>
            <p className="text-sm text-gray-600 leading-relaxed max-w-[700px]">
              {docInfo.about ||
                "No professional biography provided yet. Please update your profile."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const DetailItem = ({ label, value, isAccent = false }) => (
  <p>
    <span className="font-semibold text-teal-700">{label}:</span>{" "}
    <span
      className={
        isAccent
          ? "font-medium text-emerald-600"
          : "text-gray-700"
      }
    >
      {value || "N/A"}
    </span>
  </p>
);

export default ViewDoctor;
