import express from "express";
import defenceController from "../../controller/defenceController/memberController.js";
const router = express.Router();

router.post("/memberLogin", defenceController.memberLogin);
router.get("/dashboard/:id", defenceController.dashboardDatas);
router.get("/fetchUserData", defenceController.fetchUserData);
router.get("/fetchReceipts", defenceController.fetchReceipts);
router.get("/projectstatus", defenceController.fetchProjectStatus);
router.get("/extracharges", defenceController.extraChargeReceipts);
router.post("/contactus", defenceController.contactUs);

export default router;
