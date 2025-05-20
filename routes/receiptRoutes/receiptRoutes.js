import express from "express";
const router = express.Router();
import Receipt from "../../model/receiptModel.js";

import ReceiptController from "../../controller/receiptController/receiptController.js";
import mongoose from "mongoose";
router.get("/get-receipt-details", ReceiptController.fetchReceipts);
router.get("/get-receipt-details/:id", ReceiptController.getReceiptDetailsById);
router.get("/receipts/member/:id", ReceiptController.getViewReceiptHistory);
router.get("/view-confirmation/:memberId",ReceiptController.viewconfirmation)
router.get("/get-affidavit/:id",ReceiptController.EditAffidavit)
router.get('/checkMembershipFee/:id', async (req, res) => {
  const memberId = req.params.id;

  try {
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ feeAdded: false, message: "Invalid member ID" });
    }

    const receipt = await Receipt.findOne({ member: memberId }).lean();
    if (!receipt || !receipt.payments || receipt.payments.length === 0) {
      return res.json({ feeAdded: false, message: "No payments found." });
    }

    let totalMembershipAmount = 0;
    let hasNonMembershipPayment = false;

    for (const payment of receipt.payments) {
      if (payment.paymentType === "Membership Fee") {
        totalMembershipAmount += payment.amount;
      } else {
        hasNonMembershipPayment = true;
        break;
      }
    }

    if (hasNonMembershipPayment || totalMembershipAmount > 2500) {
      return res.json({ feeAdded: true });
    } else {
      return res.json({
        feeAdded: false,
        message: "Please generate the receipt excluding membership fees to proceed with adding a confirmation letter page."
      });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ feeAdded: false, message: "Server error." });
  }
});




export default router;
