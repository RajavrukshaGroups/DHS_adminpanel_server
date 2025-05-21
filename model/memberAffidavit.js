// models/MemberAffidavit.js

import mongoose from "mongoose";

const memberAffidavitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },
  projectAddress: {
    type: String,
  },
  chequeNo: {
    type: String,
  },
  duration: {
    type: String,

  },
  affidavitUrl: {
    type: String,
    required: true,
  },
  cloudinaryId: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  totalPaidAmount:{
    type:Number
  }
});

const MemberAffidavit = mongoose.model("MemberAffidavit", memberAffidavitSchema);
export default MemberAffidavit;
