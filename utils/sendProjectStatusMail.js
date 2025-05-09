import nodemailer from "nodemailer";

export const sendProjectStatusEmails = async ({
  projectName,
  statusTitle,
  statusDate,
  statusDetails,
  imageUrls,
  memberEmails,
}) => {
  if (!memberEmails || memberEmails.length === 0) return;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.DHS_NODEMAILER_MAIL,
      pass: process.env.DHS_NODEMAILER_KEY,
    },
  });

  const imageHtml = imageUrls
    .map((url) => {
      if (url.endsWith(".pdf")) {
        return `<p><a href="${url}" target="_blank">📎 View PDF</a></p>`;
      }
      return `
        <p style="margin-bottom: 16px;">
          <img src="${url}" alt="Project Image"
            style="max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 0 auto;" />
        </p>`;
    })
    .join("");

  const htmlBody = `
    <div style="width: 100%; padding: 16px; box-sizing: border-box; font-family: sans-serif; background-color: #f9f9f9;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px;">
        <h2 style="font-size: 24px; margin-bottom: 8px; color: #333;">${statusTitle}</h2>
        <p style="margin-bottom: 10px; color: #555;"><strong>Date:</strong> ${new Date(
          statusDate
        ).toDateString()}</p>
        <p style="margin-bottom: 16px; font-size: 16px; color: #444; line-height: 1.6;">${statusDetails}</p>
        ${imageHtml}
      </div>
    </div>`;

  for (const email of memberEmails) {
    const mailOptions = {
      from: `"Defence Housing Society" <${process.env.DHS_NODEMAILER_MAIL}>`,
      to: email,
      subject: `Project Status Update: ${projectName}`,
      html: htmlBody,
    };
    await transporter.sendMail(mailOptions);
  }
};
