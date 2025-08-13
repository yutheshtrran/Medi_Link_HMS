import React, { useContext, useState } from 'react';
import { AdminContext } from '../Context/AdminContext';
import { DoctorContext } from '../Context/DoctorContext.jsx';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const Navbar = () => {
  const { aToken, setAToken } = useContext(AdminContext);
  const { dToken, setDToken } = useContext(DoctorContext);
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false); // Confirmation modal state

  const logout = () => {
    navigate('/');
    if (aToken) {
      setAToken('');
      localStorage.removeItem('aToken');
    }
    if (dToken) {
      setDToken('');
      localStorage.removeItem('dToken');
    }
    setConfirmLogout(false);
  };

  return (
    <div className="relative">
      {/* Navbar */}
      <div className="flex justify-between items-center px-4 sm:px-10 py-3 border-b border-teal-300 bg-teal-50">
        <div className="flex items-center gap-3 text-xs">
          <img
            className="w-36 cursor-pointer"
            src={logo}
            alt="logo"
            onClick={() => navigate('/')}
          />
          <p className="border border-teal-600 cursor-pointer text-teal-800 px-2.5 py-0.5 rounded-full">
            {aToken ? 'Admin' : 'Doctor'}
          </p>
        </div>

        <button
          onClick={() => setConfirmLogout(true)}
          className="bg-teal-600 hover:bg-teal-700 transition-colors text-sm font-medium cursor-pointer px-10 py-3 rounded-sm text-white flex items-center justify-center"
        >
          Logout
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white p-6 rounded-xl shadow-xl text-center w-80">
            <p className="text-lg font-medium text-teal-900 mb-6">
              Are you sure you want to logout?
            </p>
            <div className="flex justify-between">
              <button
                onClick={logout}
                className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition-colors w-1/2 mr-2"
              >
                Yes, Logout
              </button>
              <button
                onClick={() => setConfirmLogout(false)}
                className="bg-gray-200 text-teal-900 px-4 py-2 rounded hover:bg-gray-300 transition-colors w-1/2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
