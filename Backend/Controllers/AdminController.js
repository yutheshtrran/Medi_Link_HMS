import validator from 'validator';
import bcrypt from 'bcrypt';
import { v2 as cloudinary } from 'cloudinary';
import doctorModel from '../Models/DoctorModel.js';
import jwt from 'jsonwebtoken';
import appointmentModel from '../Models/AppointmentModel.js';
import patientModel from '../Models/PatientModel.js';
import donationModel from '../Models/DonationModel.js';
import wardModel from '../Models/WardModel.js';
import BedAllocationModel from '../Models/BedAllocationModel.js';

//================================================ Add Doctor Function ===================================================
const addDoctor = async (req, res) => {
    try {
        const { name, email, password, speciality, degree, university, experience, about, address, mobile } = req.body;
        const imageFile = req.file;

        if (!name || !email || !password || !speciality || !degree || !university || !experience || !about || !address || !mobile) {
            return res.json({ success: false, message: "Please fill all the details" });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" });
        }

        const existingDoctor = await doctorModel.findOne({ $or: [{ email }, { mobile }] });
        if (existingDoctor) {
            return res.json({ success: false, message: "A doctor with this email or mobile number already exists." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        let imageUrl = '';
        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            imageUrl = imageUpload.secure_url;
        } else {
            return res.json({ success: false, message: "Doctor image is required." });
        }

        const doctorData = {
            name,
            email,
            image: imageUrl,
            password: hashPassword,
            speciality,
            degree,
            university,
            experience,
            about,
            address: JSON.parse(address),
            mobile,
            date: Date.now()
        };

        const newDoctor = new doctorModel(doctorData);
        await newDoctor.save();

        res.json({ success: true, message: "Doctor added" });

    } catch (error) {
        console.log(error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.json({ success: false, message: `Validation failed: ${messages.join(', ')}` });
        }
        res.json({ success: false, message: error.message });
    }
};

//================================================ Admin Login Function ===================================================
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.json({ success: false, message: "Please fill all the details" });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const aToken = jwt.sign(email + password, process.env.JWT_SECRET);
            res.json({ success: true, aToken });
        } else {
            res.json({ success: false, message: "Invalid email or Password" });
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

//================================================ Get all doctors ===================================================
const allDoctors = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select('-password');
        res.json({ success: true, doctors });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

//================================================= List All Doctors ==================================================
const listDoctors = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select(['-password', '-email']);
        res.json({ success: true, doctors });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

//================================================= All appointment ==================================================
const appointmentAdmin = async (req, res) => {
    try {
        const appointments = await appointmentModel.find({});
        if (appointments.length > 0) {
            res.json({ success: true, appointments });
        } else {
            res.json({ success: false, message: "No Appointments available" });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

//================================================= Cancel Appointment ==================================================
const AppointmentCancle = async (req, res) => {
    try {
        const { appointmentId } = req.body;

        const appointmentData = await appointmentModel.findById(appointmentId);
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

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
        console.error("Appointment cancel error:", error);
        res.json({ success: false, message: error.message });
    }
};

const cancelBedAllocation = async (req, res) => {
  try {
    const { bedId } = req.body;

    const allocation = await BedAllocationModel.findById(bedId);
    if (!allocation) {
      return res.status(404).json({ success: false, message: 'Bed allocation not found' });
    }

    if (allocation.status === 'discharged') {
      return res.status(400).json({ success: false, message: 'Cannot cancel a discharged bed' });
    }

    if (allocation.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Bed already cancelled' });
    }

    allocation.status = 'cancelled';
    allocation.isAdmitted = false;
    await allocation.save();

    res.status(200).json({ success: true, message: 'Bed allocation cancelled successfully', cancelled: allocation });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error cancelling bed allocation' });
  }
};


//================================================== Dashboard Data for Admin ===========================================
const adminDashboard = async (req, res) => {
    try {
        const doctors = await doctorModel.find({});
        const users = await patientModel.find({});
        const appointments = await appointmentModel.find({});
        const donations = await donationModel.find({}, 'amount');
        const totalDonations = donations.reduce((sum, d) => sum + d.amount, 0);

        const dashData = {
            doctors: doctors.length,
            users: users.length,
            appointments: appointments.length,
            latestAppointments: appointments.reverse().slice(0, 5),
            totaldonations: totalDonations,
        };

        res.json({ success: true, dashData });
    } catch (error) {
        console.error("Dashboard error:", error);
        res.json({ success: false, message: error.message });
    }
};

//================================================= Add Ward Controller ==================================================
const createWard = async (req, res) => {
    try {
        const { wardName, wardCategory, wardNumbers, features } = req.body;

        if (!wardName || !wardCategory || !Array.isArray(wardNumbers)) {
            return res.status(400).json({ message: 'Invalid input format' });
        }

        const newWard = new wardModel({ wardName, wardCategory, wardNumbers, features });
        await newWard.save();

        res.status(201).json({ message: 'Ward created successfully' });
    } catch (error) {
        console.error('Error creating ward:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

//================================================= Update Ward Controller ==================================================
const updateWard = async (req, res) => {
    try {
        const { id } = req.params;
        const { wardName, wardCategory, wardNumbers, features } = req.body;

        if (!wardName || !wardCategory || !Array.isArray(wardNumbers)) {
            return res.status(400).json({ success: false, message: 'Invalid input format' });
        }

        const updatedWard = await wardModel.findByIdAndUpdate(
            id,
            { wardName, wardCategory, wardNumbers, features },
            { new: true }
        );

        if (!updatedWard) {
            return res.status(404).json({ success: false, message: 'Ward not found' });
        }

        res.status(200).json({ success: true, message: 'Ward updated successfully', ward: updatedWard });
    } catch (error) {
        console.error('Error updating ward:', error);
        res.status(500).json({ success: false, message: 'Server error while updating ward' });
    }
};

//================================================== Get Allocated Beds ==================================================
const getAllocatedBedsByWard = async (req, res) => {
    try {
        const { wardName, wardNo } = req.query;

        if (!wardName || !wardNo) {
            return res.status(400).json({ success: false, message: 'wardName and wardNo are required' });
        }

        const beds = await BedAllocationModel.find({ wardName, wardNo })
            .populate('userId', 'name email phone_number')
            .sort({ allocationTime: -1 });

        res.status(200).json({ success: true, beds });

    } catch (error) {
        console.error('Error in getAllocatedBedsByWard:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching allocated beds' });
    }
};

//============================================ Confirm Bed Admission ==================================================
const confirmBedAdmission = async (req, res) => {
    try {
        const { bedId } = req.body;

        const updated = await BedAllocationModel.findByIdAndUpdate(
            bedId,
            { isAdmitted: true },
            { new: true }
        ).populate('userId', 'name email phone_number');

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Bed not found' });
        }

        res.status(200).json({
            success: true,
            message: `Admission confirmed for ${updated.userId?.name}`,
            allocation: updated,
        });

    } catch (error) {
        console.error('Error confirming admission:', error);
        res.status(500).json({ success: false, message: 'Server error while confirming bed admission' });
    }
};

//============================================= Discharge Patient ==================================================
const dischargePatient = async (req, res) => {
    try {
        const { bedId } = req.body;

        const allocation = await BedAllocationModel.findById(bedId);

        if (!allocation) {
            return res.status(404).json({ success: false, message: 'Bed allocation not found' });
        }

        if (!allocation.isAdmitted) {
            return res.status(400).json({ success: false, message: 'Patient is not admitted yet' });
        }

        allocation.status = 'discharged';
        allocation.isAdmitted = false;
        allocation.dischargedAt = new Date();
        await allocation.save();

        res.status(200).json({ success: true, message: 'Patient discharged successfully', discharged: allocation });

    } catch (error) {
        console.error('Discharge error:', error);
        res.status(500).json({ success: false, message: 'Server error while discharging patient' });
    }
};

//================================================== EXPORTS ===================================================
export {
    addDoctor,
    adminLogin,
    allDoctors,
    listDoctors,
    appointmentAdmin,
    AppointmentCancle,
    adminDashboard,
    createWard,
    updateWard, // ✅ Added here
    getAllocatedBedsByWard,
    confirmBedAdmission,
    dischargePatient,
    cancelBedAllocation
};
