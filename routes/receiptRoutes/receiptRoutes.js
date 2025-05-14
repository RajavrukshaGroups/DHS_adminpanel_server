import express from "express";
const router = express.Router();

import ReceiptController from "../../controller/receiptController/receiptController.js";

router.get("/get-receipt-details", ReceiptController.fetchReceipts);

export default router;
