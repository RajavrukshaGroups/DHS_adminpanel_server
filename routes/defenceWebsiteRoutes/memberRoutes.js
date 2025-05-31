import express from "express";
import defenceController from "../../controller/defenceController/memberController.js";
const router = express.Router();

router.post("/memberLogin",defenceController.memberLogin)
router.get("/dashboard/:id",defenceController.dashboardDatas)


export default router;
