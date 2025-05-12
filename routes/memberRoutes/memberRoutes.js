import express from "express";
import MemberController from "../../controller/memberController/memberController.js";
import formidable from "express-formidable";
import upload from "../../middleware/multer.js";
import memberController from "../../controller/memberController/memberController.js";
import Member from "../../model/memberModel.js"; // adjust path as needed
const router = express.Router();

router.post(
  "/add-member",
  formidable({ multiples: true }),
  MemberController.addMemberDetails
);
router.get("/view-member-details", MemberController.getMemberDetails);
router.get("/check-duplicates", memberController.checkDuplicates);
router.put("/update-status/:id", memberController.updateStatus);
router.get("/inactive-members", memberController.getInactiveMembers);
router.post("/membercredentials", MemberController.sendMemberLoginDetails);

export default router;
