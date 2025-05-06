import express from "express";
import AddProjectDetController from "../../controller/projectController/projectController.js";
import upload from "../../middleware/multer.js";

const router = express.Router();

router.post("/add-project", AddProjectDetController.addProjectDetails);
router.get("/all-projects", AddProjectDetController.getProjectDetails);
router.patch("/update-land-details", AddProjectDetController.updateLandDetails);
router.get("/search-projectname", AddProjectDetController.searchProjectName);
router.post(
  "/project-status",
  upload.array("files", 10),
  AddProjectDetController.postProjectStatus
);

export default router;
