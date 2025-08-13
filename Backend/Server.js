import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDatabase from './config/mongodb.js';
import connectCloudinary from './config/Cloudinary.js';
import adminRouter from './Routes/AdminRoute.js';
import doctorRouter from './Routes/DoctorRoute.js';
import userRouter from './Routes/UserRoute.js';
import donationRouter from './Routes/DonationRouter.js';
import { startBedReleaseScheduler } from './utils/bedReleaseScheduler.js';
import path from 'path';

//================= App Config ===================//

const app = express();
const port = process.env.PORT || 4000; // Changed default to 4000

//================= Database & Cloudinary ===================//

connectDatabase();
connectCloudinary();

//================= Middleware ===================//

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(path.resolve(), 'uploads')));

//================= API Routes ===================//

app.use('/api/admin', adminRouter);
app.use('/api/doctor', doctorRouter);
app.use('/api/user', userRouter);
app.use('/api/donation', donationRouter);

//================= Bed Scheduler ===================//

startBedReleaseScheduler();

//================= Start Server ===================//

app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});
