import mongoose from 'mongoose';

const doctorCertificateSchema = new mongoose.Schema({

  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'doctor', required: true },

  certificateId: { type: String, required: true },

  certificateURL: { type: String, required: true },

  uploadedAt: { type: Date, default: Date.now }
  
});

export default mongoose.model('DoctorCertificate', doctorCertificateSchema);
