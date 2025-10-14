import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { DoctorContext } from '../../Context/DoctorContext'; // token & backendURL

const ViewDoctor = () => {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const { backendURL, dToken } = useContext(DoctorContext);

  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!backendURL || !dToken) {
        toast.error("Missing credentials. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${backendURL}/api/doctor/profile`, {
          headers: {
            Authorization: `Bearer ${dToken}`, // fetch logged-in doctor
          },
        });

        if (response.data.success) {
          setDoctor(response.data.doctor);
        } else {
          toast.error(response.data.message || "Failed to fetch profile.");
        }
      } catch (error) {
        toast.error("Error loading profile.");
        console.error("Axios error fetching doctor profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, [backendURL, dToken]);

  if (loading) return <div className="m-5 text-center text-gray-600">Loading doctor profile... ⏳</div>;
  if (!doctor) return <div className="m-5 text-center text-red-600">Doctor profile not found. 😢</div>;

  const docInfo = doctor;

  return (
    <div className="flex flex-col sm:flex-row gap-4 mt-5">
      {/* Doctor Image */}
      <div>
        <img className="w-full sm:max-w-72 rounded-lg" src={docInfo.image} alt={docInfo.name} />
      </div>

      {/* Doctor Details */}
      <div className="flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0">
        <p className="flex items-center gap-2 text-xl font-medium text-gray-900">{docInfo.name}</p>

        <div className="text-sm mt-2 text-gray-600 leading-6">
          <p><span className="font-medium text-gray-800">Degree:</span> {docInfo.degree}</p>
          <p><span className="font-medium text-gray-800">University:</span> {docInfo.university}</p>
          <p><span className="font-medium text-gray-800">Specialized:</span> {docInfo.speciality}</p>
          <p><span className="font-medium text-gray-800">Contact:</span> {docInfo.mobile}</p>
          <p><span className="font-medium text-gray-800">Experience:</span> {docInfo.experience}</p>

          {docInfo.address && (
            <div>
              <p><span className="font-medium text-gray-800">Address:</span></p>
              <p>{docInfo.address.line1}</p>
              <p>{docInfo.address.line2}</p>
            </div>
          )}
        </div>

        <div>
          <p className="flex items-center gap-1 text-sm font-medium text-gray-900 mt-3">
            About
          </p>
          <p className="text-sm text-gray-500 max-w-[700px] mt-1 leading-6">{docInfo.about}</p>
        </div>
      </div>
    </div>
  );
};

export default ViewDoctor;
