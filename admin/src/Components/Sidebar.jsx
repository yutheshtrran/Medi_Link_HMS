import React, { useContext } from 'react'
import { AdminContext } from '../Context/AdminContext'
import { NavLink } from 'react-router-dom'
import { assets } from '../assets/assets'
import { DoctorContext } from '../Context/DoctorContext'
import profile_icon from '../assets/profile_icon.svg' // Assuming you have a profile icon

const Sidebar = () => {
  const { aToken } = useContext(AdminContext)
  const { dToken } = useContext(DoctorContext)

  const activeClass = "bg-[#d7f0f7] border-r-4 border-teal-500"

  return (
    <div className='min-h-screen bg-white border-r border-r-teal-300'>
      {aToken && (
        <ul className='text-[#004d4d] mt-5'>
          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${
                isActive ? activeClass : ''
              }`
            }
            to={'/admin-dashboard'}
          >
            <img src={assets.home_icon} alt="Dashboard" className='w-5 h-5' />
            <p className='hidden md:block'>Dashboard</p>
          </NavLink>

          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${
                isActive ? activeClass : ''
              }`
            }
            to={'/all-appointment'}
          >
            <img src={assets.appointment_icon} alt="All Appointment" className='w-5 h-5' />
            <p className='hidden md:block'>All Appointment</p>
          </NavLink>

          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${
                isActive ? activeClass : ''
              }`
            }
            to={'/add-doctor'}
          >
            <img src={assets.add_icon} alt="Add Doctor" className='w-5 h-5' />
            <p className='hidden md:block'>Add Doctor</p>
          </NavLink>

          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${
                isActive ? activeClass : ''
              }`
            }
            to={'/doctor-list'}
          >
            <img src={assets.people_icon} alt="Doctors List" className='w-5 h-5' />
            <p className='hidden md:block'>Doctors List</p>
          </NavLink>

          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${
                isActive ? activeClass : ''
              }`
            }
            to={'/ward'}
          >
            <img src={assets.ward} alt="Ward Management" className='w-5 h-5' />
            <p className='hidden md:block'>Ward Management</p>
          </NavLink>

          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${
                isActive ? activeClass : ''
              }`
            }
            to={'/bed-management'}
          >
            <img src={assets.bedManagement} alt="Bed Management" className='w-5 h-5' />
            <p className='hidden md:block'>Bed Management</p>
          </NavLink>
        </ul>
      )}

      {dToken && (
        <ul className='text-[#004d4d] mt-5'>
          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${
                isActive ? activeClass : ''
              }`
            }
            to={'/doctor-dashboard'}
          >
            <img src={assets.home_icon} alt="Dashboard" className='w-5 h-5' />
            <p className='hidden md:block'>Dashboard</p>
          </NavLink>

          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${
                isActive ? activeClass : ''
              }`
            }
            to={'/doctor-appointment'}
          >
            <img src={assets.appointment_icon} alt="Doctor Appointment" className='w-5 h-5' />
            <p className='hidden md:block'>Doctor Appointment</p>
          </NavLink>

          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${
                isActive ? activeClass : ''
              }`
            }
            to={'/verify-doctor'}
          >
            <img src={assets.verify} alt="Doctors Verify" className='w-5 h-5' />
            <p className='hidden md:block'>Doctors Verify</p>
          </NavLink>

          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${
                isActive ? activeClass : ''
              }`
            }
            to={'/feedback-doctor'}
          >
            <img src={assets.feedback} alt="Doctors Feedback" className='w-5 h-5' />
            <p className='hidden md:block'>Doctors Feedback</p>
          </NavLink>

          {/* NEW Profile NavLink */}
          <NavLink
  className={({ isActive }) =>
    `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${
      isActive ? activeClass : ''
    }`
  }
  to={'/doctor/profile'}
>
  <img src={assets.profile_icon} alt="Profile" className='w-5 h-5' />
  <p className='hidden md:block'>My Profile</p>
</NavLink>

        </ul>
      )}
    </div>
  )
}

export default Sidebar
