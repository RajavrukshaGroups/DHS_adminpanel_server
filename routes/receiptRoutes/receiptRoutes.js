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

    if (!receipt || !receipt.payments?.length) {
      return res.json({ feeAdded: false, message: "No payments found." });
    }

    const hasNonMembershipPayment = receipt.payments.some(
      (payment) => payment.paymentType !== "Membership Fee"
    );

    const totalMembershipAmount = receipt.payments
      .filter((payment) => payment.paymentType === "Membership Fee")
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);

    if (hasNonMembershipPayment || totalMembershipAmount > 2500) {
      return res.json({ feeAdded: true });
    }

    return res.json({
      feeAdded: false,
      message:
        "Please add a receipt without membership fees to continue with the confirmation letter.",
    });

  } catch (err) {
    console.error("Error checking membership fee:", err);
    res.status(500).json({ feeAdded: false, message: "Server error." });
  }
});



export default router;
