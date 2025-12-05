// controller/dhsChethanTapasihalli/dhsChethanTapasihalliController.js
import nodemailer from "nodemailer";

const dhsChethanTapasihalliEmailSubmit = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body || {};
    if (!firstName || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "firstName, email and message are required.",
      });
    }

    // Use consistent env var names
    const SMTP_HOST = process.env.DHS_Chethan_SMTP_HOST || "smtp.hostinger.com";
    const SMTP_PORT = Number(process.env.DHS_Chethan_SMTP_PORT || 465);
    const SMTP_SECURE = process.env.DHS_Chethan_SMTP_SECURE
      ? process.env.DHS_Chethan_SMTP_SECURE === "true"
      : true;
    const SMTP_USER = process.env.DHS_Chethan_SMTP_USER; // info.raj@defencehousingsociety.com...
    const SMTP_PASS = process.env.DHS_Chethan_SMTP_PASS;

    if (!SMTP_USER || !SMTP_PASS) {
      console.error("SMTP credentials missing (DHS_Chethan_SMTP_USER / PASS)");
      return res
        .status(500)
        .json({ success: false, message: "Email service not configured." });
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    // optional: verify transporter early to surface auth/connect errors
    await transporter.verify();

    const subject = `Website Enquiry — ${firstName} ${lastName || ""}`.trim();
    const html = `
      <h3>New website enquiry</h3>
      <p><strong>Name:</strong> ${firstName} ${lastName || ""}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || "N/A"}</p>
      <p><strong>Message:</strong><br/>${(message || "").replace(
        /\n/g,
        "<br/>"
      )}</p>
    `;
    const text = `New enquiry from ${firstName} ${
      lastName || ""
    }\nEmail: ${email}\nPhone: ${phone || "N/A"}\n\nMessage:\n${message}`;

    // IMPORTANT: set 'from' to the authenticated SMTP_USER (owner of mailbox)
    const mailOptions = {
      from: `"${firstName} ${lastName || ""}" <${SMTP_USER}>`, // must be owned by SMTP_USER
      to: "info.raj@defencehousingsociety.com", // recipient
      subject,
      text,
      html,
      replyTo: email, // reply will go to the visitor
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Contact email sent:", info.messageId);

    return res.json({ success: true, message: "Message sent." });
  } catch (err) {
    console.error("Contact send error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send message." });
  }
};

export default { dhsChethanTapasihalliEmailSubmit };
