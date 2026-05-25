import mongoose from "mongoose";

const memberAffidavitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    MembershipNo: {
      type: String,
      // required: true,
      index: true,
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
      // required: true,
    },
    cloudinaryId: {
      type: String,
      // required: true,
    },
    confirmationLetterIssueDate: {
      type: Date,
      default: Date.now,
    },
    totalPaidAmount: {
      type: Number,
    },
    // confirmationLetterReceiptNo: {
    //   type: Number,
    // },
    confirmationLetterReceiptNo: [
      {
        type: String,
      },
    ],
    confirmationPayments: [
      {
        receiptNo: String,
        amount: Number,
        date: Date,
        paymentMode: String,
        bankName: String,
        branchName: String,
        chequeNumber: String,
        transactionId: String,
        ddNumber: String,
      },
    ],
    ConfirmationLetterNo: {
      type: String,
    },
  },
  { timestamps: true },
);

const MemberAffidavit = mongoose.model(
  "MemberAffidavit",
  memberAffidavitSchema,
);
export default MemberAffidavit;
