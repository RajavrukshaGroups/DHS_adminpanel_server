
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
    required: true,
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
  receiptIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Receipt",
    },
  ],
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
             chequeNo:{
            type:String,
          
           },
             transactionId:{
               type:String,
             },
           DDNumber:{
            type:String,
          
           }
});

const Member = mongoose.model("Member", memberSchema);
export default Member;
