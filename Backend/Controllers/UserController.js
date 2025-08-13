import validator from 'validator'
import bcrypt from 'bcrypt'
import patientModel from '../Models/PatientModel.js';
import jwt from 'jsonwebtoken'
import {v2 as cloudinary} from 'cloudinary'
import doctorModel from '../Models/DoctorModel.js';
import appointmentModel from '../Models/AppointmentModel.js';
import wardModel from '../Models/WardModel.js';
import BedAllocationModel from '../Models/BedAllocationModel.js';
import { sendSms } from '../utils/sendSms.js';
import Feedback from '../Models/FeedBackModel.js';
import ReportModel from '../Models/ReportModel.js';

//====================================== Register User ==================================================

const registerUser = async(req , res) => {

    try {
        const {name , email , password} = req.body;
        
        if(!name || !email || !password) {
            return res.json({success:false , message:"Missing Data!"});
        }

        if(!validator.isEmail(email)) {
            return res.json({success:false , message:"Invalid Email"})
        }

        if(password.length < 8) {
            return res.json({success:false , message:"Please enter a strong Password"})
        }

        const salt = await bcrypt.genSalt(10)
        const hashPassword = await bcrypt.hash(password , salt);

        const userData = {
            name,
            email,
            password : hashPassword
        }

        const newUser = new patientModel(userData);
        const user = await newUser.save();
        const token = jwt.sign({id:user._id}, process.env.JWT_SECRET)
        res.json({success:true , token});
        
    } catch (error) {
        console.log(error);
        res.json({success:false , message : error.message});
    }
}

//================================================== API for user Login ======================================================

const loginUser = async(req , res) => {
    try {
        const {email , password} = req.body;
        const user = await patientModel.findOne({email});
        if(!user) {
            return res.json({success:false , message:"User Does not exist"})
        }

        const isMatch = await bcrypt.compare(password , user.password);
        if(isMatch) {
            const token = jwt.sign({id:user._id} , process.env.JWT_SECRET);
            res.json({success:true , token});
        }
        else {
            return res.json({success:false , message:"Please enter a Correct Password"})
        }
    } catch (error) {
        console.log(error);
        res.json({success:false , message : error.message});
    }
}

//===================================================== My Profile ============================================================

const getProfile = async(req  , res) => {
    try {
        const {userId} = req.body;
        const userData = await patientModel.findById(userId).select('-password')
        res.json({success:true , userData});
    } catch (error) {
        console.log(error);
        res.json({success:false , message : error.message});
    }
}

//============================================== Update User Profile ====================================================

const updateUserProfile = async (req, res) => {
    try {
        const { userId, name, dob, gender, address, phone_number } = req.body;
        const imageFile = req.file;

        if (!name || !dob || !gender || !phone_number) {
            return res.json({ success: false, message: "Data missing" });
        }

        const updatedUser = await patientModel.findByIdAndUpdate(
            userId,
            { name, phone_number, address: JSON.parse(address), dob, gender },
            { new: true }
        );

        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' });
            const imageURL = imageUpload.secure_url;
            await patientModel.findByIdAndUpdate(userId, { image: imageURL }, { new: true });
        }

        res.json({ success: true, message: "Profile Updated", updatedUser });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

//========================================== Book Appointment ====================================================

const bookAppointment = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;

    const docData = await doctorModel.findById(docId).select('-password');
    if (!docData) {
      return res.json({ success: false, message: 'Sorry, doctor is not available.' });
    }

    let slots_booked = docData.slots_booked || {};

    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.json({ success: false, message: 'Sorry, slot is not available.' });
      } else {
        slots_booked[slotDate].push(slotTime);
      }
    } else {
      slots_booked[slotDate] = [slotTime];
    }

    const userData = await patientModel.findById(userId).select('-password');
    if (!userData) {
      return res.json({ success: false, message: 'Invalid patient.' });
    }

    const { slots_booked: _, ...docDataWithoutSlots } = docData.toObject();

    const appointmentData = {
      userId,
      docId,
      userData,
      docData: docDataWithoutSlots,
      slotTime,
      slotDate,
      date: Date.now()
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    if (userData.phone_number) {
      try {
        const formattedPhone = userData.phone_number.startsWith('94')
          ? userData.phone_number
          : `94${userData.phone_number.slice(-9)}`;

        const smsMessage = `Dear ${userData.name},\n\nYour appointment with ${docData.name} has been successfully booked.\n\n📅 Date: ${slotDate.replace(/_/g, '/')}  ⏰ Time: ${slotTime}\n\nPlease arrive 10 minutes early.\n\n- Ministry of Health`;

        await sendSms(formattedPhone, smsMessage);
        console.log(`Appointment SMS sent to ${formattedPhone}`);
      } catch (smsError) {
        console.error(`Failed to send SMS: ${smsError.message}`);
      }
    }

    res.json({ success: true, message: "Appointment Booked" });

  } catch (error) {
    console.error("Appointment booking error:", error);
    res.json({ success: false, message: error.message });
  }
};

//============================================ Get User Appointments ====================================================

const listAppointment = async (req, res) => {
  try {
      const { userId } = req.body;
      const appointments = await appointmentModel.find({userId});
      res.json({success:true , appointments});
  } catch (error) {
      console.error("Appointment booking error:", error);
      res.json({ success: false, message: error.message });
  }
}

//============================================ Cancel Appointment ====================================================

const cancleAppointment = async (req, res) => {
  try {
      const {userId , appointmentId} = req.body;
      const appointmentData = await appointmentModel.findById(appointmentId);

      if(appointmentData.userId != userId) {
          return res.json({success:false , message:"Unauthorized User"})
      }

      await appointmentModel.findByIdAndUpdate(appointmentId , {cancelled:true});

      const { docId, slotDate, slotTime } = appointmentData;
      const doctorData = await doctorModel.findById(docId);

      if (!doctorData) {
          return res.json({ success: false, message: "Doctor not found" });
      }

      let slots_booked = doctorData.slots_booked || {};

      if (slots_booked[slotDate]) {
          slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);
      }

      await doctorModel.findByIdAndUpdate(docId, { slots_booked });

      res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
      console.error("Appointment booking error:", error);
      res.json({ success: false, message: error.message });
  }
}

//============================================ Cancel Bed Allocation ====================================================

const cancelBed = async (req, res) => {
  try {
    const { userId, allocationId } = req.body;

    if (!userId || !allocationId) {
      return res.status(400).json({ success: false, message: "Missing userId or allocationId" });
    }

    const allocation = await BedAllocationModel.findById(allocationId);

    if (!allocation) {
      return res.status(404).json({ success: false, message: "Allocation not found" });
    }

    if (allocation.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized user" });
    }

    allocation.status = "cancelled"; // Mark as cancelled so bed becomes free
    await allocation.save();

    res.json({ success: true, message: "Bed allocation cancelled successfully" });

  } catch (error) {
    console.error("Cancel bed error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//============================================ Get All Ward Details ====================================================

const getAllWards = async(req , res) => {
  try {
      const wards = await wardModel.find();
      res.status(200).json(wards);
  } catch (error) {
      console.error('Error fetching wards:', error);
      res.status(500).json({ message: 'Server error while fetching wards' });
  }
}

//============================================ Allocate Bed ===============================================================

const allocateBed = async(req , res) => {
  try {
      const {userId , wardName, wardNo, bedNo} = req.body;

      // Check if user already has an active allocation
      const existingBooking = await BedAllocationModel.findOne({
          userId,
          status: 'active' // only active counts as blocking
      });

      if (existingBooking) {
          return res.status(400).json({ success: false, message: 'User already has an active bed allocation.' });
      }

      // Check if bed is already allocated actively
      const existingBed = await BedAllocationModel.findOne({
          wardName,
          wardNo,
          bedNo,
          status: 'active' // only active means occupied
      });

      if(existingBed) {
          return res.status(400).json({ success: false, message: 'This bed is already allocated to another patient.' });
      }

      const allocation = new BedAllocationModel({
          userId,
          wardName,
          wardNo,
          bedNo,
          status: 'active' // mark new allocation active
      });

      await allocation.save();

      const patient = await patientModel.findById(userId);

      if(patient && patient.phone_number) {
          const phone = patient.phone_number;
          const formattedPhone = phone.startsWith("94") ? phone : `94${phone.slice(-9)}`;

          const message = `Dear ${patient.name},\n\n`+
          `Your bed has been successfully allocated.\n\n`+
          `Ward Name: ${wardName}\n`+
          `Room Number: Room ${wardNo}\n`+
          `Bed Number: Bed ${bedNo}\n\n`+
          `Please arrive within 2 hours to confirm your admission.\n\n`+
          `– Ministry Of Health`;

          try {
            await sendSms(formattedPhone, message);
          } catch(smsError) {
            console.warn("SMS sending failed:", smsError.message);
          }
      }

      res.status(201).json({success:true , message:'Bed successfully allocated', allocation});

  } catch (error) {
      console.error('Bed allocation error:', error);
      res.status(500).json({success:false , message:'Server error while allocating bed'});
  }
}

//============================================= Get Allocated Beds ====================================================

const getAllocatedBeds = async (req, res) => {
  try {
      const { wardName, wardNo } = req.query;

      const beds = await BedAllocationModel.find({
          wardName,
          wardNo,
          status: 'active' // Only active are allocated (occupied)
      }).select('bedNo -_id');

      const allocatedBedNumbers = beds.map(b => b.bedNo);

      res.status(200).json({ success: true, allocatedBeds: allocatedBedNumbers });

  } catch (error) {
      console.error('Error fetching allocated beds:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch allocated beds' });
  }
};

//============================================== Submit Feedback ======================================================

const submitFeedback = async(req , res) => {
  try {
    const { userId, message } = req.body;

    if(!userId || !message) {
      return res.status(400).json({success:false , message:"Missing data"});
    }

    const feedback = new Feedback({
      userId,
      message
    });

    await feedback.save();

    res.status(201).json({success:true , message:"Feedback submitted successfully"});

  } catch(error) {
    console.error("Feedback error:", error);
    res.status(500).json({success:false , message:"Server error"});
  }
};

//=============================================== Get User Reports ===================================================

const getMyReport = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing userId" });
    }
    const reports = await ReportModel.find({ userId });
    res.status(200).json({ success: true, reports });
  } catch (error) {
    console.error("Get report error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

export {
  registerUser,
  getMyReport,
  submitFeedback,
  loginUser,
  getProfile,
  updateUserProfile,
  bookAppointment,
  listAppointment,
  cancleAppointment,
  getAllWards,
  allocateBed,
  getAllocatedBeds,
  cancelBed
};
