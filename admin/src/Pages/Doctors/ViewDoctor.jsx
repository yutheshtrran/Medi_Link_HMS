import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import DoctorProfile from './DoctorProfile';
import { toast } from 'react-toastify';
import { DoctorContext } from '../../Context/DoctorContext';

const ViewDoctor = () => {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const { backendURL, dToken } = useContext(DoctorContext); // Doctor's token and backend URL

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
            Authorization: `Bearer ${dToken}`, // Correct Authorization header
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

  if (loading) {
    return <div className="m-5 text-center text-gray-600">Loading doctor profile... ⏳</div>;
  }

  if (!doctor) {
    return <div className="m-5 text-center text-red-600">Doctor profile not found. 😢</div>;
  }

  return <DoctorProfile doctorData={doctor} />;
};

export default ViewDoctor;
