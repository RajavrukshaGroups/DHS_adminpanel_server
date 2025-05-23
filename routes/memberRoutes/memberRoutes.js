import express from "express";
import MemberController from "../../controller/memberController/memberController.js";
import formidable from "express-formidable";
// import upload from '../../middleware/multer.js';
import memberController from "../../controller/memberController/memberController.js";
import Member from "../../model/memberModel.js"; // adjust path as needed
const router = express.Router();
import { uploadToCloudinary } from "../../utils/cloudinary.js"; // adjust path as needed
import upload from "../../middleware/multer.js";
import MemberAffidavit from "../../model/memberAffidavit.js"; // adjust path as needed

router.post(
  "/add-member",
  formidable({ multiples: true }),
  MemberController.addMemberDetails
);
router.get("/view-member-details", MemberController.getMemberDetails);
router.get("/check-duplicates", memberController.checkDuplicates);
router.put("/update-status/:id", memberController.updateStatus);
router.get("/inactive-members", memberController.getInactiveMembers);
router.get("/get-confirmation/:id", memberController.getConfirmation);
router.post(
  "/add-confirmation/:id",
  upload.single("affidivate"),
  memberController.addConfirmation
);
router.get("/all", memberController.getAllAffidavits);
router.post("/membercredentials", MemberController.sendMemberLoginDetails);
router.delete("/delete-member/:id", MemberController.deleteMember);
router.get("/get-member/:id", MemberController.getMemberById);
router.put(
  "/update-member/:id",
  formidable({ multiples: true }),
  MemberController.updateMemberDetails
);
router.post("/add-receipt/:memberId", MemberController.addReceiptToMember);
router.put(
  "/edit-confirmation/:id",
  upload.single("affidivate"),
  MemberController.editConfirmationLetter
);
router.get("/get-affidavit/:id", memberController.getAffidavitById);
router.put("/edit-receipt/:memberId", MemberController.editReceiptToMember);
router.get(
  "/check-payment-type-duplicates/:memberId",
  MemberController.checkDuplicatesPaymentTypeToAddReceipt
);

router.get("/get-all-member-details", MemberController.getMemberData);
router.delete(
  "/delete-member-receipt-payment/:memberId",
  MemberController.deleteMemberReceiptPaymentEach
);






export default router;
