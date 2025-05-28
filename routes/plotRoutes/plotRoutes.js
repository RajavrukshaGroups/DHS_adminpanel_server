import express from "express";
import PlotController from "../../controller/plotController/plotController.js";
import PlotTransfer from "../../model/plotTransfer.js"
import upload from "../../middleware/multer.js";
const router = express.Router();


router.get("/getMemberBySeniorityID/:id", PlotController.getMemberBySeniorityID);

router.post(
  "/create-transfer",
  upload.fields([
    { name: "memberPhoto", maxCount: 1 },
    { name: "memberSign", maxCount: 1 },
  ]),
  PlotController.CreateTransfer);

router.get('/plot-Transferhistory',PlotController.plotTransferhistory)
// router.post('/plot-cancel',PlotController.cancelMemberPlot)
router.post("/plot-cancel", upload.single("cancelLetter"),PlotController.cancelMemberPlot);
router.get("/plot-cancelled-list",PlotController.getCancelledMembers)


export default router;
