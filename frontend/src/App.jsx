import React from 'react'
import {Route , Routes, useLocation} from 'react-router-dom'
import Home from './Pages/Home'
import Doctors from './Pages/Doctors'
import Login from './Pages/Login'
import About from './Pages/About'
import Contact from './Pages/Contact'
import MyProfile from './Pages/MyProfile'
import MyAppointment from './Pages/MyAppointment'
import Navbar from './Components/Navbar'
import Footer from './Components/Footer'
import Appointment from './Pages/Appointment'
import MedicalReport from './Pages/MedicalReport'
import BedAllocation from './Pages/BedAllocation'
import { ToastContainer, toast } from 'react-toastify';
import Donation from './Pages/Donation'
import DonationSuccess from './Pages/DonationSuccess'
import DiseasePredictor from './Pages/DiseasePredictor'
import HealthAndFitnessCalculator from './Pages/HealthAndFitnessCalculator'  



const App = () => {

  const location = useLocation();
  const hideFooterRoutes = ['/login'];

  return (
    <div className='mx-4 sm:mx-[10%]'>

      <ToastContainer/>

      <Navbar/>

      <Routes>
        <Route path='/' element = {<Home/>}/>
        <Route path='/doctors' element = {<Doctors/>}/>
        <Route path='/doctors/:speciality' element = {<Doctors/>}/>
        <Route path='/login' element = {<Login/>}/>
        <Route path='/about' element = {<About/>}/>
        <Route path='/report' element = {<MedicalReport/>}/>
        <Route path='/bed' element = {<BedAllocation/>}/>
        <Route path='/donation' element = {<Donation/>}/>
        <Route path='/donation-success' element = {<DonationSuccess/>}/>
        <Route path='/contact' element = {<Contact/>}/>
        <Route path='/my-profile' element = {<MyProfile/>}/>
        <Route path='/my-appointment' element = {<MyAppointment/>}/>
        <Route path='/appointment/:docId' element = {<Appointment/>}/>
        <Route path='/disease-predictor' element = {<DiseasePredictor/>}/>
        <Route path='/health-and-fitness-calculator' element = {<HealthAndFitnessCalculator/>}/>
      </Routes>

      
      
      {/* Conditionally render Footer */}
      {!hideFooterRoutes.includes(location.pathname) && <Footer />}
      
    </div>
  )
}

export default App