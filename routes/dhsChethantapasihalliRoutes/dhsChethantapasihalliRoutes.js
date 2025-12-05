import express from "express";
import dhsChethanTapasihalliController from "../../controller/dhsChethanTapasihalli/dhsChethanTapasihalliController.js";
const router = express.Router();

router.post(
  "/dhsChethan-email-contact",
  dhsChethanTapasihalliController.dhsChethanTapasihalliEmailSubmit
);

export default router;
