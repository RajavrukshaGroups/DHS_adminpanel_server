import mongoose from "mongoose";

const projectStatusSchema = new mongoose.Schema(
  {
    projectName: { type: String, required: true },
    statusDate: { type: Date, required: true },
    statusTitle: { type: String, required: true },
    statusDetails: { type: String, required: true },
    image: [{ type: String }], // URLs or filenames of uploaded files
    sendSMS: { type: Boolean, default: false },
    sendEmail: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const ProjectStatus = mongoose.model("ProjectStatus", projectStatusSchema);

export default ProjectStatus;
