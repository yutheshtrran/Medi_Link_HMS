import mongoose from "mongoose";

const bedAllocationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  wardName: { type: String, required: true },
  wardNo: { type: Number, required: true },
  bedNo: { type: Number, required: true },
  allocationTime: { type: Date, default: Date.now },
  isAdmitted: { type: Boolean, default: false },
  status: { type: String, enum: ['active','pending', 'admitted', 'discharged', 'cancelled'], default: 'pending' },
  dischargedAt: { type: Date, default: null }
});

export default mongoose.model('BedAllocation', bedAllocationSchema);


