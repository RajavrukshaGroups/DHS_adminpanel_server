import express from "express";
import AddProjectDetController from "../../controller/projectController/projectController.js";
import upload from "../../middleware/multer.js";
import { get } from "http";

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
router.get("/all-projectstatus", AddProjectDetController.getProjectStatus);
router.delete(
  "/delete-projectstatus/:id",
  AddProjectDetController.deleteProjectStatus
);
router.get(
  "/indprojectstatus/:id",
  AddProjectDetController.getIndProjectStatus
);
router.put(
  "/update-indprojectstatus/:id",
  upload.array("files", 10),
  AddProjectDetController.updateIndProjectStatus
);

export default router;
