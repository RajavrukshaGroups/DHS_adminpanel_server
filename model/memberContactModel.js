import mongoose, { mongo } from "mongoose";

const memberContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
    },
    message: {
      type: String,
    },
    location: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const MemberContact = mongoose.model("MemberContact", memberContactSchema);
export default MemberContact;
