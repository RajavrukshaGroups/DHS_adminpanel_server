import express from "express";
import PlotController from "../../controller/plotController/plotController.js";
import PlotTransfer from "../../model/plotTransfer.js"
const router = express.Router();



router.get("/getMemberBySeniorityID/:id", PlotController.getMemberBySeniorityID);

router.post("/plot-transfer",PlotController.CreateTransfer)
export default router;
