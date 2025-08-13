import express from 'express'
import { listDoctors } from '../Controllers/AdminController.js'
import { appointmentCancle, appointmentComplete, appointmentsDoctor, doctorDashboard, getDoctorFeedbacks, loginDoctor, uploadMedicalReport, verifyDoctorCertificate } from '../Controllers/DoctorController.js';
import authDoctor from '../Middlewares/AuthDoctor.js';
import upload from '../Middlewares/Multer.js';
import localUpload from '../Middlewares/LocalUpload.js';


const doctorRouter = express.Router()

doctorRouter.get('/list' , listDoctors);

doctorRouter.post('/login' , loginDoctor);

doctorRouter.get('/appointment' , authDoctor , appointmentsDoctor);

doctorRouter.post('/complete' , authDoctor , appointmentComplete);

doctorRouter.post('/cancle' , authDoctor , appointmentCancle);

doctorRouter.get('/dashboard'  , authDoctor , doctorDashboard);

doctorRouter.post('/verify-certificate', upload.single('certificate'), authDoctor, verifyDoctorCertificate);

doctorRouter.post('/upload-report' , localUpload.single('file') , authDoctor , uploadMedicalReport)

doctorRouter.get('/feedbacks', authDoctor, getDoctorFeedbacks);

export default doctorRouter