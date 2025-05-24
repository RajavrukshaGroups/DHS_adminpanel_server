// models/Transfer.js
import mongoose from "mongoose";

const transferSchema = new mongoose.Schema({
  fromMember: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },
  toMember: {
    name: { type: String, required: true },
    mobileNumber: { type: String },
    email: { type: String },
    address: { type: String },
  },
  transferDate: {
    type: Date,
    required: true,
  },
  reason: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Transfer", transferSchema);