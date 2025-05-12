import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.DHS_NODEMAILER_MAIL,
    pass: process.env.DHS_NODEMAILER_KEY,
  },
});
