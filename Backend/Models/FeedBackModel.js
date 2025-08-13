import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true }, 
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "doctor", required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "appointment", required: true },
  rating: { type: Number, required: true },
  comment: { type: String },
  anonymous: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Feedback = mongoose.models.feedback || mongoose.model('feedback', feedbackSchema);
export default Feedback;
