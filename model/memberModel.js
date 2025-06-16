import mongoose from "mongoose";

const propertyDetailsSchema = new mongoose.Schema({
  projectName: { type: String },
  propertySize: { type: Number },
  pricePerSqft: { type: Number },
  propertyCost: { type: Number },
  percentage: { type: Number },
  percentageCost: { type: Number },
  length: { type: Number },
  breadth: { type: Number },
  paidAmount: { type: Number, default: 0 },
});

const cancellationSchema = new mongoose.Schema({
  reason: {
    type: String,
    required: true,
  },
  cancellationDate: {
    type: Date,
    default: Date.now,
  },
  remarks: {
    type: String,
  },
  cancellationLetter: {
    type: String, // Store URL or base64 string
  },
});

const memberSchema = new mongoose.Schema({
  refname: {
    type: String,
  },
  rankDesignation: {
    type: String,
  },
  serviceId: {
    type: String,
  },
  relationship: {
    type: String,
  },
  saluation: {
    type: String,
  },
  propertyDetails: {
    type: propertyDetailsSchema,
    // required: true,
  },
  name: {
    type: String,
  },
  mobileNumber: {
    type: Number,
  },
  AlternativeNumber: {
    type: Number,
  },
  email: {
    type: String,
  },
  dateofbirth: {
    type: Date,
  },
  fatherName: {
    type: String,
  },
  contactAddress: {
    type: String,
  },
  permanentAddress: {
    type: String,
  },
  workingAddress: {
    type: String,
  },
  MemberPhoto: {
    type: String,
  },
  MemberSign: {
    type: String,
  },
  nomineeName: {
    type: String,
  },
  nomineeAge: {
    type: Number,
  },
  nomineeRelation: {
    type: String,
  },
  nomineeAddress: {
    type: String,
  },
  SeniorityID: {
    type: String,
  },
  MembershipNo: {
    type: String,
  },
  
  ConfirmationLetterNo: {
    type: String,
  },

  ShareCertificateNumber: {
    type: String,
  },

  isTransferred: {
    type: Boolean,
    default: false,
  },

  cancellationDetails: {
    type: cancellationSchema,
    default: null, // If not cancelled, this remains null
  },

  transferReason: {
    type: String,
  },
  previousMemberDetails: {
    name: String,
    email: String,
    mobileNumber: Number,
    MemberPhoto: String,
    MemberSign: String,
  },

  receiptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Receipt",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  password: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const Member = mongoose.model("Member", memberSchema);
export default Member;
