import express from "express";
import AddProjectDetController from "../../controller/projectController/projectController.js";

const router = express.Router();

router.post("/add-project", AddProjectDetController.addProjectDetails);
router.get("/all-projects", AddProjectDetController.getProjectDetails);
router.patch("/update-land-details", AddProjectDetController.updateLandDetails);

export default router;
