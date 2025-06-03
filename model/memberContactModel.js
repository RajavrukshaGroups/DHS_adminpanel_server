import mongoose, { mongo } from "mongoose";

const memberContactSchema = new mongoose.Schema({
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
    required: true,
  },
  message: {
    type: String,
  },
  location: {
    type: String,
  },
});

const MemberContact = mongoose.model("MemberContact", memberContactSchema);
export default MemberContact;
