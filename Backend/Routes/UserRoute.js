import express from 'express'
import { allocateBed, bookAppointment, cancleAppointment, getAllocatedBeds, getAllWards, getMyReport, getProfile, listAppointment, loginUser, registerUser, submitFeedback, updateUserProfile } from '../Controllers/UserController.js';
import authUser from '../Middlewares/AuthUser.js';
import upload from '../Middlewares/Multer.js';

const userRouter  = express.Router();

userRouter.post('/register' , registerUser);
userRouter.post('/login' , loginUser);
userRouter.get('/get-profile', authUser , getProfile)
userRouter.post('/update-profile' , upload.single('image'), authUser , updateUserProfile)
userRouter.post('/book-appointment' , authUser , bookAppointment);
userRouter.get('/appointments' , authUser , listAppointment);
userRouter.post('/cancel-appointment' , authUser , cancleAppointment);
userRouter.get('/wards' , authUser , getAllWards);
userRouter.post('/allocate-bed' , authUser , allocateBed)
userRouter.get('/allocated-beds' , authUser , getAllocatedBeds)
userRouter.post('/submit-feedback' , authUser , submitFeedback);
userRouter.get('/my-reports' , authUser , getMyReport);


export default userRouter;