import { createContext, useEffect, useState, useMemo } from "react";
import axios from 'axios';
import { toast } from 'react-toastify';

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const backendUrl = 'http://localhost:4000';

  const [doctors, setDoctors] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token') || false);
  const [userData, setUserData] = useState(false);
  const [wards, setWards] = useState([]);
  const [voiceIntent, setVoiceIntent] = useState(null);

  // =================== Fetch Doctors ===================
  const getDoctorsData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/doctor/list`);
      if (data.success) {
        setDoctors(data.doctors);
        console.log(data.doctors);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  // =================== Fetch User Profile ===================
  const loadUserProfileData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/get-profile`, {
        headers: { token }
      });

      if (data.success) {
        setUserData(data.userData);
        console.log(data.userData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // =================== Update User Profile ===================
  const updateUserProfile = async (updatedData, imageFile) => {
    try {
      const formData = new FormData();
      formData.append("userId", userData._id);
      formData.append("name", updatedData.name);
      formData.append("dob", updatedData.dob);
      formData.append("gender", updatedData.gender);
      formData.append("phone_number", updatedData.phone_number);
      formData.append("address", JSON.stringify(updatedData.address));
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const { data } = await axios.post(
        `${backendUrl}/api/user/update-profile`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            token
          }
        }
      );

      if (data.success) {
        toast.success(data.message);
        setUserData(data.updatedUser);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error("Profile update failed.");
    }
  };

  // =================== Fetch Wards ===================
  const getWards = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/wards`, {
        headers: { token }
      });

      setWards(data);
    } catch (error) {
      console.error('Failed to fetch wards:', error);
      toast.error('Failed to load wards');
    }
  };

  // =================== useEffect Hooks ===================
  useEffect(() => {
    getDoctorsData();
    getWards();
  }, []);

  useEffect(() => {
    if (token) {
      loadUserProfileData();
    } else {
      setUserData(false);
    }
  }, [token]);

  // Sync token to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  // =================== Memoized Context ===================
  const contextValue = useMemo(() => ({
    doctors,
    getDoctorsData,
    token,
    setToken,
    backendUrl,
    userData,
    loadUserProfileData,
    updateUserProfile,
    wards,
    getWards,
    setVoiceIntent
  }), [doctors, token, userData, wards, voiceIntent]);

  return (
    <AppContext.Provider value={contextValue}>
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
