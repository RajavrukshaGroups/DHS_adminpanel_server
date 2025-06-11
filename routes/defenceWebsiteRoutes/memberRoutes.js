import express from "express";
import defenceController from "../../controller/defenceController/memberController.js";
import formidable from "express-formidable";
import puppeteer from "puppeteer";
import upload from "../../middleware/multer.js";
import nodemailer from "nodemailer";
// import  sendApplicationDownloadEmail  from "../../controller/defenceController/memberController.js";
import { sendApplicationDownloadEmail } from "../../controller/defenceController/memberController.js";

const router = express.Router();

router.post("/memberLogin", defenceController.memberLogin);
router.get("/dashboard/:id", defenceController.dashboardDatas);
router.post(
  "/add-onlinemember",
  formidable({ multiples: true }),
  defenceController.AddOnlineApplication
);
router.get("/fetchUserData", defenceController.fetchUserData);
router.get("/fetchReceipts", defenceController.fetchReceipts);
router.get("/projectstatus", defenceController.fetchProjectStatus);
router.get("/extracharges", defenceController.extraChargeReceipts);
router.post("/contactus", defenceController.contactUs);
router.post("/send-otp", defenceController.sendOtpToEmail);
router.post(
  "/get-online-applications",
  defenceController.getOnlineApplications
);

router.post("/verify-otp", defenceController.verifyOtp);
router.get("/get-application/:id", defenceController.getOnlineApplicationById);
router.post("/resend-otp", defenceController.sendOtpToEmail);
router.post(
  "/dashboard-contact-admin",
  defenceController.memberDashBoardContactAdmin
);
router.get("/get-transferred-history/:id",defenceController.GetTrnasferedhistory);

// router.post("/download", async (req, res) => {
//   const formData = req.body;

//   try {
//     const browser = await puppeteer.launch({ headless: "new" });
//     const page = await browser.newPage();

//     const queryString = new URLSearchParams({
//       name: formData.name,
//       email: formData.email,
//       mobile: formData.mobile,
//       address: formData.address
//     }).toString();

//     await page.goto(
//       `http://localhost:4000/defenceWebsiteRoutes/render?${queryString}`,
//       {
//         waitUntil: "networkidle0",
//       }
//     );

//     const pdfBuffer = await page.pdf({
//       format: "A4",
//       printBackground: true,
//     });

//     await browser.close();

//     res.set({
//       "Content-Type": "application/pdf",
//       "Content-Disposition": "attachment; filename=ApplicationForm.pdf",
//       "Content-Length": pdfBuffer.length,
//     });

//     res.send(pdfBuffer);
//   } catch (error) {
//     console.error("PDF generation error:", error);
//     res.status(500).send("Failed to generate PDF");
//   }
// });

router.post("/download", async (req, res) => {
  const formData = req.body;

  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    const queryString = new URLSearchParams({
      name: formData.name,
      email: formData.email,
      mobile: formData.mobile,
      address: formData.address,
    }).toString();

    await page.goto(`http://localhost:4000/defenceWebsiteRoutes/render?${queryString}`, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    // Send Email Notification
    await sendApplicationDownloadEmail(formData);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=ApplicationForm.pdf",
      "Content-Length": pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).send("Failed to generate PDF");
  }
});

// Render the EJS form template for Puppeteer
router.get("/render", (req, res) => {
  const { name, email, mobile, address } = req.query;
  res.render("application", { name, email, mobile, address });
});


export default router;
