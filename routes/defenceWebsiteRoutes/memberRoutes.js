import express from "express";
import defenceController from "../../controller/defenceController/memberController.js";
import formidable from "express-formidable";
import upload from "../../middleware/multer.js";

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

export default router;
