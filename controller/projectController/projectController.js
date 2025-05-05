import Project from "../../model/projectModel.js";

const addProjectDetails = async (req, res) => {
  try {
    const { projectName, shortCode, status, dimensions } = req.body;

    if (!projectName || !shortCode || !status || !Array.isArray(dimensions)) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided." });
    }

    if (dimensions.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one dimension is required." });
    }

    const invalidDim = dimensions.find(
      (dim) =>
        typeof dim.length !== "number" ||
        dim.length <= 0 ||
        typeof dim.breadth !== "number" ||
        dim.breadth <= 0
    );

    if (invalidDim) {
      return res.status(400).json({
        message:
          "Each dimension must include a valid length and breadth greater than zero.",
      });
    }

    const projectNameLower = projectName.trim().toLowerCase();
    const shortCodeLower = shortCode.trim().toLowerCase();

    const existingShortCode = await Project.findOne({
      shortCode: shortCodeLower,
    });
    const existingProjectName = await Project.findOne({
      projectName: projectNameLower,
    });

    if (existingShortCode && existingProjectName) {
      return res
        .status(409)
        .json({ message: "Short code and project name already exist." });
    }
    if (existingShortCode) {
      return res.status(409).json({ message: "Short code already exists." });
    }
    if (existingProjectName) {
      return res.status(409).json({ message: "Project name already exists." });
    }

    const newProject = new Project({
      projectName: projectNameLower,
      shortCode: shortCodeLower,
      status,
      dimensions,
    });

    await newProject.save();

    return res.status(201).json({
      message: "Project added successfully.",
      project: newProject,
    });
  } catch (err) {
    console.error("Error adding project:", err);

    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getProjectDetails = async (req, res) => {
  try {
    const projects = await Project.find(
      {},
      { projectName: 1, dimensions: 1, _id: 0 }
    );
    res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error("error fetching project details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch project details",
      error: error.message,
    });
  }
};

const updateLandDetails = async (req, res) => {
  const { projectName, dimensionId, pricePerSqft, propertyCost } = req.body;

  try {
    const project = await Project.findOne({ projectName });
    if (!project) {
      return res.status(400).json({
        message: "Project not found.",
      });
    }
    const dimension = project.dimensions.id(dimensionId);
    if (!dimension) {
      return res.status(404).json({ message: "Dimension not found" });
    }

    dimension.pricePerSqft = pricePerSqft;
    dimension.propertyCost = propertyCost;

    await project.save();

    res.status(200).json({ message: "Land details updated successfully" });
  } catch (err) {
    console.error("error updating  the land details", err);
    res.status(500).json({ message: "Server error" });
  }
};

export default {
  addProjectDetails,
  getProjectDetails,
  updateLandDetails,
};
