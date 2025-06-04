import express from "express";
import authController from "../../controller/authController.js";
const router = express.Router();

router.post("/adminLogin", authController.adminLogin);
router.get("/contactedmembers", authController.contactedMembers);

export default router;
