import express from "express";
import PlotController from "../../controller/plotController/plotController.js"
const router = express.Router();



router.get("/getMemberBySeniorityID/:id", PlotController.getMemberBySeniorityID);

export default router;
