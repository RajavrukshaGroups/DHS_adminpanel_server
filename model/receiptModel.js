import mongoose from "mongoose";

const paymentEntrySchema = new mongoose.Schema({
  receiptNo: { type: String, required: true },
  date: { type: Date, required: true },
  paymentType: { type: String, required: true }, // 'Membership Fee', 'Site Advance', 'Installment', etc.
  installmentNumber: String, // Only for paymentType === 'Installment'
  paymentMode: { type: String, required: true },
  bankName: String,
  branchName: String,
  amount: { type: Number, required: true },
  chequeNumber: String,
  transactionId: String,
  ddNumber: String,
  paid: { type: Boolean, default: true },
  otherCharges: String,
  correspondenceAddress: String,

  // Membership-specific fields:
  applicationFee: {
    type: Number,
    required: function () {
      return this.paymentType === "Membership Fee";
    },
  },
  admissionFee: {
    type: Number,
    required: function () {
      return this.paymentType === "Membership Fee";
    },
  },
  miscellaneousExpenses: {
    type: Number,
    required: function () {
      return this.paymentType === "Membership Fee";
    },
  },
  membershipFee: {
    type: Number,
    required: function () {
      return this.paymentType === "Membership Fee";
    },
  },
  shareFee: {
    type: Number,
    required: function () {
      return this.paymentType === "Membership Fee";
    },
  },
  numberOfShares: {
    type: Number,
    required: function () {
      return this.paymentType === "Membership Fee";
    },
  },
});

const receiptSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Member",
    required: true,
  },
  payments: [paymentEntrySchema],
});

const Receipt = mongoose.model("Receipt", receiptSchema);
export default Receipt;
