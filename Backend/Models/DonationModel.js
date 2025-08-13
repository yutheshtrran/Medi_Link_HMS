// models/DonationModel.js
import mongoose from "mongoose";

const donationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  email: {
    type: String,
    required: false,
    validate: {
      validator: function (v) {
        return !v || /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  message: {
    type: String,
    required: false,
    maxlength: 300
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const donationModel = mongoose.model('donation', donationSchema);

export default donationModel;
