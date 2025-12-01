import express from "express";
import DeployController from "../../controller/deployController/deployController.js";
const router = express.Router();

router.get("/deploy-routes", DeployController.checkDeployRoutes);

export default router;
