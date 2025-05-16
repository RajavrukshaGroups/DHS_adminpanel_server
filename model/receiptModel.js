import mongoose from "mongoose";

const receiptSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },
  receiptNo: String,
  date: Date,
  noOfShares: Number,
  shareFee: Number,
  membershipFee: Number,
  applicationFee: Number,
  admissionFee: Number,
  miscellaneousExpenses: Number,
  paymentType: String,
  paymentMode: String,
  bankName: String,
  branchName: String,
  amount: Number,
  chequeNumber: String,
  transactionId: String,
  ddNumber: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Receipt = mongoose.model("Receipt", receiptSchema);
export default Receipt;
