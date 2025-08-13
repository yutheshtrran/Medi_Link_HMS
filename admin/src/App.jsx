import React, { useContext } from 'react'
import Login from './Pages/Login'
import { ToastContainer, toast } from 'react-toastify'
import { AdminContext } from './Context/AdminContext'
import Navbar from './Components/Navbar.Jsx'
import Sidebar from './Components/Sidebar'
import {Route, Routes} from 'react-router-dom'
import Dashboard from './Pages/Admins/Dashboard'
import AllAppointments from './Pages/Admins/AllAppointments'
import AddDoctor from './Pages/Admins/AddDoctor'
import DoctorsList from './Pages/Admins/DoctorsList'
import {Navigate} from 'react-router-dom'
import { DoctorContext } from './Context/DoctorContext'
import DoctorDashboard from './Pages/Doctors/DoctorDashboard'
import DoctorAppointment from './Pages/Doctors/DoctorAppointment'
import AddWard from './Pages/Admins/AddWard'
import BedManagement from './Pages/Admins/BedManagement'
import VerifyDoctor from './Pages/Doctors/VerifyDoctor'
import DoctorFeedback from './Pages/Doctors/DoctorFeedback'
import ViewDoctor from './Pages/Doctors/ViewDoctor'


const App = () => {

  const{aToken} = useContext(AdminContext)
  const{dToken} = useContext(DoctorContext)

  return aToken || dToken ? (
    
    <div className='bg-[#F8F9FD]'>

      <ToastContainer/>

      <Navbar/>

      <div className='flex items-start'>

        <Sidebar/>

        <Routes>

          {/*Admin Route*/}

          <Route path='/' element={
            aToken ? <Navigate to="/admin-dashboard" /> :
            dToken ? <Navigate to="/doctor-dashboard" /> :
            <Navigate to="/" />
          } />


          <Route path='/admin-dashboard' element={<Dashboard/>}/>

          <Route path='/all-appointment' element={<AllAppointments/>}/>

          <Route path='/add-doctor' element={<AddDoctor/>}/>

          <Route path='/doctor-list' element={<DoctorsList/>}/>

          <Route path='/ward' element={<AddWard/>}/>

          <Route path='/bed-management' element={<BedManagement/>}/>

          {/*doctor Route*/}
          <Route path='/doctor' element={<Navigate to="/doctor-dashboard" />} />
          <Route path='/doctor-dashboard' element={<DoctorDashboard/>}/>
          <Route path='/doctor-appointment' element={<DoctorAppointment/>}/>
          <Route path='/verify-doctor' element={<VerifyDoctor/>}/>
          <Route path='/feedback-doctor' element={<DoctorFeedback/>}/>
          {/*Doctor Profile*/}
          <Route path="/doctor/profile" element={<ViewDoctor />} />

        </Routes>

      </div>

    </div>
  ):
  (
    <>

      <Login/>

      <ToastContainer/>

    </>
  )
}

export default App