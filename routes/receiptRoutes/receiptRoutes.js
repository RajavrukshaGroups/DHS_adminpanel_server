import express from "express";
const router = express.Router();
import Receipt from "../../model/receiptModel.js";

import ReceiptController from "../../controller/receiptController/receiptController.js";
router.get("/get-receipt-details", ReceiptController.fetchReceipts);
router.get("/get-receipt-details/:id", ReceiptController.getReceiptDetailsById);
router.get("/receipts/member/:id", ReceiptController.getViewReceiptHistory);
router.get("/view-confirmation/:memberId",ReceiptController.viewconfirmation)



router.get("/get-affidavit/:id", ReceiptController.EditAffidavit);
router.get("/checkMembershipFee/:id", ReceiptController.CheckMembershipFee);
router.get(
  "/edit-receipt/payment-history/:receiptId",
  ReceiptController.FetchEditReceiptHistory
);


export default router;
