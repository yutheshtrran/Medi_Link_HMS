import React, { useContext, useState } from "react";
import { assets } from "../assets/assets";
import logo from "../assets/logo.png";
import { NavLink, useNavigate } from "react-router-dom";
import { AppContext } from "../Context/AppContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { token, setToken } = useContext(AppContext);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const logout = () => {
    setToken(false);
    localStorage.removeItem("token");
    setConfirmLogout(false);
    navigate("/"); // Optional: redirect to homepage after logout
  };

  return (
    <div className="flex items-center justify-between text-sm text-teal-900 py-4 border-b border-teal-300 relative z-10">
      <img
        onClick={() => navigate("/")}
        className="w-44 cursor-pointer"
        src={logo}
        alt="medi link logo"
      />
      <ul className="hidden md:flex items-start gap-5 font-medium ml-[200px]">
  <NavLink to={"/"}>
    <li className="py-1 hover:text-teal-600 transition-colors">HOME</li>
  </NavLink>
  <NavLink to={"/doctors"}>
    <li className="py-1 hover:text-teal-600 transition-colors">ALL DOCTORS</li>
  </NavLink>
  <NavLink to={"/disease-predictor"}>
    <li className="py-1 hover:text-teal-600 transition-colors">DISEASE PREDICTOR</li>
  </NavLink>
  <NavLink to={"/health-and-fitness-calculator"}>
    <li className="py-1 hover:text-teal-600 transition-colors">CALCULATOR</li>
  </NavLink>
  <NavLink to={"/about"}>
    <li className="py-1 hover:text-teal-600 transition-colors">ABOUT</li>
  </NavLink>
  <NavLink to={"/contact"}>
    <li className="py-1 hover:text-teal-600 transition-colors">CONTACT</li>
  </NavLink>
     </ul>


      <div className="flex items-center gap-5">
        {token ? (
          <div className="flex items-center gap-2 cursor-pointer group relative">
            <img
              src={assets.user}
              alt="User Icon"
              className="w-10 rounded-full border-2 border-teal-500"
            />
            <img src={assets.dropdown_icon} alt="Dropdown" />
            <div className="absolute top-0 right-0 pt-15 text-balance font-medium text-teal-900 z-20 hidden group-hover:block">
              <div className="min-w-48 bg-teal-50 rounded flex flex-col gap-4 p-4 shadow-lg">
                <p onClick={() => navigate("/my-profile")} className="hover:text-teal-700 cursor-pointer">My Profile</p>
                <p onClick={() => navigate("/my-appointment")} className="hover:text-teal-700 cursor-pointer">My Appointment</p>
                <p onClick={() => navigate("/report")} className="hover:text-teal-700 cursor-pointer">My Medical Report</p>
                <p onClick={() => navigate("/bed")} className="hover:text-teal-700 cursor-pointer">Bed Allocation</p>
                <p onClick={() => navigate("/donation")} className="hover:text-teal-700 cursor-pointer">Donation</p>
                <p onClick={() => setConfirmLogout(true)} className="hover:text-teal-700 cursor-pointer">Logout</p>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="bg-teal-600 cursor-pointer text-white px-8 py-4 rounded-full font-medium hidden md:block hover:bg-teal-700 transition-colors duration-300"
          >
            Create account
          </button>
        )}

        <img
          onClick={() => setShowMenu(true)}
          className="m-6 md:hidden cursor-pointer"
          src={assets.menu_icon}
          alt="Menu"
        />
      </div>

      {/* Mobile Menu */}
      <div
        className={`${
          showMenu ? "fixed w-full" : "h-0 w-0"
        } md:hidden right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}
      >
        <div className="flex items-center justify-between px-5 py-6 border-b border-teal-300">
          <img className="w-36" src={logo} alt="Logo" />
          <img
            className="w-7 cursor-pointer"
            onClick={() => setShowMenu(false)}
            src={assets.cross_icon}
            alt="Close"
          />
        </div>
        <ul className="flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium text-teal-900">
          <NavLink onClick={() => setShowMenu(false)} to="/">
            <li className="hover:text-teal-600 transition-colors w-full text-center py-2">Home</li>
          </NavLink>
          <NavLink onClick={() => setShowMenu(false)} to="/doctors">
            <li className="hover:text-teal-600 transition-colors w-full text-center py-2">All Doctors</li>
          </NavLink>
          <NavLink onClick={() => setShowMenu(false)} to="/about">
            <li className="hover:text-teal-600 transition-colors w-full text-center py-2">About</li>
          </NavLink>
          <NavLink onClick={() => setShowMenu(false)} to="/contact">
            <li className="hover:text-teal-600 transition-colors w-full text-center py-2">Contact Us</li>
          </NavLink>
          <NavLink onClick={() => setShowMenu(false)} to="/disease-predictor">
            <li className="hover:text-teal-600 transition-colors w-full text-center py-2">Disease Predictor</li>
          </NavLink>
          <NavLink onClick={() => setShowMenu(false)} to="/Health-and-fitness-calculator">
            <li className="hover:text-teal-600 transition-colors w-full text-center py-2">Calculator</li>
          </NavLink>
        </ul>
      </div>

      {/* ✅ Logout Confirmation Modal */}
      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white p-6 rounded-xl shadow-xl text-center w-80">
            <p className="text-lg font-medium text-teal-900 mb-6">Are you sure you want to logout?</p>
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
