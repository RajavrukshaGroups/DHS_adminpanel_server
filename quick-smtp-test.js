import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

(async () => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.DHS_Chethan_SMTP_HOST || "smtp.hostinger.com",
      port: Number(process.env.DHS_Chethan_SMTP_PORT || 465),
      secure: process.env.DHS_Chethan_SMTP_SECURE === "true" || true,
      auth: {
        user: process.env.DHS_Chethan_SMTP_USER,
        pass: process.env.DHS_Chethan_SMTP_PASS,
      },
    });

    await transporter.verify();
    console.log("SMTP verified — credentials are OK");

    const info = await transporter.sendMail({
      from: `"Test" <${process.env.DHS_Chethan_SMTP_USER}>`,
      to: process.env.DHS_Chethan_SMTP_USER, // send to yourself for test
      subject: "SMTP quick test",
      text: "This is a quick smtp test from Node.",
    });

    console.log("Test email sent:", info.messageId);
  } catch (err) {
    console.error("SMTP test failed:", err);
  }
})();
