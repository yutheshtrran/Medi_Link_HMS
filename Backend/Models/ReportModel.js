import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
    
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "doctor", required: true },
  
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "appointment", required: true },
  
  title: { type: String, required: true },
  
  medicines: { type: String },
  
  reportUrl: { type: String, required: true },

  doctorName: { type: String, required: true },
  
  date: { type: Date, default: Date.now }
  
});

const ReportModel = mongoose.models.report || mongoose.model('report', reportSchema);

export default ReportModel;
