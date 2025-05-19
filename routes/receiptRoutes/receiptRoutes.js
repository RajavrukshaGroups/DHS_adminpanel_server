import express from "express";
const router = express.Router();

import ReceiptController from "../../controller/receiptController/receiptController.js";
import Member from "../../model/memberModel.js";
import MemberAffidavit from "../../model/memberAffidavit.js";

router.get("/get-receipt-details", ReceiptController.fetchReceipts);
router.get("/get-receipt-details/:id", ReceiptController.getReceiptDetailsById);
router.get("/receipts/member/:id", ReceiptController.getViewReceiptHistory);
router.get("/get-affidavit/:id",ReceiptController.getAffidavitByUserId)
// router.get('/view-confirmation/:id', async (req, res) => {
//     console.log("Fetching confirmation letter for member ID:", req.params.id);
//     const memberId = req.params.id;
//     try {
//     //   const member = await Member.findOne({ userId: memberId }).populate('userId');
//       const member = await Member.findOne();
//       console.log("Member data:", member);

//       if (!member) return res.status(404).send("Member not found");
//       res.json(member);  // ✅ send data
//     } catch (err) {
//       console.error(err);
//       res.status(500).send("Server error");
//     }
//   });

// import MemberAffidavit from "../models/MemberAffidavit.js";
// GET /receipt/view-confirmation/:memberId

router.get("/view-confirmation/:memberId", async (req, res) => {
  try {
    const { memberId } = req.params;
    console.log(memberId,'memberiddddddddd');
    

    const affidavit = await MemberAffidavit.findOne({
      userId: memberId,
    }).populate("userId");

    console.log("Affidavit data:", affidavit);

    if (!affidavit) {
      return res.status(404).send("Affidavit not found");
    }

    res.render("viewsiteBookingConfirmation", { member: affidavit });
} catch (error) {
    console.error("Error:", error);
    // Return here too
    return res.status(500).send("Server Error");
  }
});

export default router;




// export default router;
