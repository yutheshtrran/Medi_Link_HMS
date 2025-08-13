
import doctorModel from "../Models/DoctorModel.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import appointmentModel from "../Models/AppointmentModel.js";
import { v2 as cloudinary } from 'cloudinary';
import DoctorCertificateModel from "../Models/DoctorCertificateModel.js";
import Feedback from "../Models/FeedBackModel.js";
import ReportModel from "../Models/ReportModel.js";

//================================================ Doctor Availablity ===================================================
const changeAvailablity = async(req , res) => {

    try 
    {

        const {docId} = req.body;

        const docData = await doctorModel.findById(docId);

        await doctorModel.findByIdAndUpdate(docId , {available: !docData.available})

        res.json({success:true , message:"Availablity Changed"});
        
        
    } catch (error) 
    {

        console.log(error);

        res.json({success:false , message : error.message});
        
    }
}

//================================================ Doctor Login ===================================================

const loginDoctor = async(req , res) => 
{
    try 
    {

        const {email , password} = req.body;

        if(!email)
        {
            return res.json({success:false , message:"Email is required"})
        }

        if(!password)
        {
            return res.json({success:false , message:"Password is required"})
        }

        const doctor = await doctorModel.findOne({email});

        if(!doctor)
        {
            return res.json({success:false , message:"Doctor not found"})
        }

        const isMatch = await bcrypt.compare(password, doctor.password);

        if(!isMatch)
        {
            return res.json({success:false , message:"Invalid Password"})
        }
        else
        {
            const token = jwt.sign({id:doctor._id} , process.env.JWT_SECRET , {expiresIn:'1d'});

            res.json({success:true , token});
        }




        
    } catch (error) 
    {
        console.log(error);

        res.json({success:false , message : error.message});
    }
}


//================================================ Doctor appointments ===================================================

const appointmentsDoctor = async(req , res) =>
{
    try 
    {

        const {docId} = req.body;

        const appointments = await appointmentModel.find({docId});

        res.json({success:true , appointments});
        
    } catch (error) 
    {

        console.log(error);

        res.json({success:false , message : error.message});
        
    }
}

//=================================================== Complete Appointment =================================================

const appointmentComplete = async(req , res) => {

    try 
    {

        const {docId , appointmentId} = req.body;

        const appointmentData = await appointmentModel.findById(appointmentId);

        if(appointmentData && appointmentData.docId === docId)
        {
            await appointmentModel.findByIdAndUpdate(appointmentId , {isCompleted : true})

            return res.json({success:true , message:"Appointment Completed"})
        }   
        else
        {
            return res.json({success:false , message:"Mark Falied"})
        }
        
    } catch (error) 
    {

        console.log(error);

        res.json({success:false , message : error.message});
        
    }

}

//=================================================== Complete Appointment =================================================

const appointmentCancle = async(req , res) => {

    try 
    {

        const {docId , appointmentId} = req.body;

        const appointmentData = await appointmentModel.findById(appointmentId);

        if(appointmentData && appointmentData.docId === docId)
        {
            await appointmentModel.findByIdAndUpdate(appointmentId , {cancelled : true})

            return res.json({success:true , message:"Appointment Cancelled"})
        }   
        else
        {
            return res.json({success:false , message:"Cancelled Falied"})
        }
        
    } catch (error) 
    {

        console.log(error);

        res.json({success:false , message : error.message});
        
    }

}

//=================================================== Dashboard Data =================================================

const doctorDashboard = async (req, res) => {
    try {
      const { docId } = req.body;
  
      const appointments = await appointmentModel.find({ docId });
      const feedbacks = await Feedback.find({ doctorId: docId });
  
      const patientSet = new Set();
      appointments.forEach((item) => {
        patientSet.add(item.userId);
      });
  
      // Counters
      let totalCompleted = 0;
      let completedToday = 0;
      let cancelled = 0;
      let pending = 0;
      let todayAppointments = 0;
  
      const today = new Date();
      const todayDay = today.getDate();
      const todayMonth = today.getMonth() + 1;
      const todayYear = today.getFullYear();
  
      appointments.forEach((item) => {
        if (item.isCompleted) totalCompleted++;
        if (item.cancelled) cancelled++;
        if (!item.cancelled && !item.isCompleted) pending++;
  
        const [day, month, year] = item.slotDate.split('_').map(Number);
  
        if (day === todayDay && month === todayMonth && year === todayYear) {
          todayAppointments++;
  
          if (item.isCompleted) completedToday++;
        }
      });
  
      // Calculate Average Rating
      let averageRating = 0;
      if (feedbacks.length > 0) {
        const totalRating = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
        averageRating = (totalRating / feedbacks.length).toFixed(1); // 1 decimal place
      }
  
      // Prepare dashboard data
      const dashData = {
        appointments: appointments.length,
        patients: patientSet.size,
        completedAppointmentsToday: completedToday,
        totalCompletedAppointments: totalCompleted,
        cancelledAppointments: cancelled,
        pendingAppointments: pending,
        todayAppointments: todayAppointments,
        averageRating: Number(averageRating), // send it as a number not string
        latestAppointments: appointments.reverse().slice(0, 5),
      };

      console.log(dashData);
  
      res.json({ success: true, dashData });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

//=================================================== Verify Doctor =================================================

const verifyDoctorCertificate = async(req , res) =>
{
    
    try 
    {

        const {certificateId } = req.body;
         
        const certificateFile = req.file;

        if (!certificateId) 
        {
            return res.status(400).json({

              success: false,

              message: "Certificate ID is required"

            });

        }

        if (!certificateFile) 
        {
            return res.status(400).json({

              success: false,

              message: "Certificate file is required"

            });

        }

        const uploaded = await cloudinary.uploader.upload(certificateFile.path , {resource_type:"auto"});

        const certificateURL = uploaded.secure_url;

        const record = await DoctorCertificateModel({

            doctorId: req.body.docId, 
            
            certificateId,

            certificateURL

        });

        await record.save();

        res.status(201).json({

            success: true,

            message: "Certificate submitted successfully",

            data: record

        });

        
        
    } 
    catch (error) 
    {

        console.error("Error verifying doctor certificate:", error);

        res.status(500).json({ success: false, message: "Server error during certificate verification" });
        
    }
}

//=================================================== upload medical Report =================================================

const uploadMedicalReport = async (req, res) => {
    try {
      const { appointmentId, title, medicines, docId } = req.body;
      const file = req.file;
  
      if (!appointmentId || !title || !file) {
        return res.json({ success: false, message: "Please fill all required fields" });
      }
  
      const appointment = await appointmentModel.findById(appointmentId);
  
      if (!appointment) {
        return res.json({ success: false, message: "Invalid Appointment" });
      }
  
      const userId = appointment.userId;
      const doctor = await doctorModel.findById(docId);
      const doctorName = doctor ? doctor.name : "Unknown Doctor";
  
      // Save the local file path (relative)
      const reportUrl = `/uploads/${file.filename}`;
  
      const newReport = new ReportModel({
        doctorId: docId,
        userId: userId,
        appointmentId,
        title,
        medicines,
        reportUrl,        // <<< Save local path here
        doctorName: doctorName,
        date: Date.now()
      });
  
      await newReport.save();
  
      res.json({ success: true, message: "Report uploaded successfully" });
    } catch (error) {
      console.log(error);
      res.json({ success: false, message: error.message });
    }

  };

  //=================================================== Get All Feedbacks =================================================

  const getDoctorFeedbacks = async (req, res) => 
  {

    try 
    {

      const { docId } = req.body;


      const feedbacks = await Feedback.find({ doctorId: docId }).populate('userId', 'name').sort({ createdAt: -1 });

      const formattedFeedbacks = feedbacks.map(fb => ({

        patientName: fb.anonymous ? "Anonymous" : fb.userId?.name || "Unknown",

        rating: fb.rating,

        comment: fb.comment || "No comment provided",

        time: fb.createdAt

      }));

      res.json({ success: true, feedbacks: formattedFeedbacks });

    } 
    catch (error) 
    {

      console.error(error);

      res.json({ success: false, message: error.message });
      
    }
  }
  

//=================================================== Exporting Controllers =================================================

export{changeAvailablity , getDoctorFeedbacks , uploadMedicalReport , loginDoctor , appointmentsDoctor , appointmentComplete , appointmentCancle , doctorDashboard , verifyDoctorCertificate}