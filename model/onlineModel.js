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


const onlineSchema = new mongoose.Schema({
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

  transferReason: {
    type: String,
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

const Online = mongoose.model("Onlineapplication", onlineSchema);
export default Online;
