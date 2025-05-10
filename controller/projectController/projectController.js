import { error } from "console";
import Project from "../../model/projectModel.js";
import ProjectStatus from "../../model/projectStatusModel.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";
import Member from "../../model/memberModel.js";
import nodemailer from "nodemailer";
import { sendProjectStatusEmails } from "../../utils/sendProjectStatusMail.js";

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
      { projectName: 1, dimensions: 1, status: 1, shortCode: 1, _id: 0 }
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

const searchProjectName = async (req, res) => {
  const { searchQuery } = req.query;

  try {
    const projects = await Project.find({
      projectName: { $regex: searchQuery, $options: "i" },
    });

    if (projects.length === 0) {
      return res
        .status(404)
        .json({ message: `Project name '${searchQuery}' not found` });
    }

    res.status(200).json({ data: projects });
  } catch (err) {
    console.error("Error searching for projects:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const postProjectStatus = async (req, res) => {
  try {
    const {
      projectName,
      statusDate,
      statusTitle,
      statusDetails,
      sendSMS,
      sendEmail,
    } = req.body;

    // Backend validation
    if (!projectName || !statusDate || !statusTitle || !statusDetails) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // File validation
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      const validFileTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];
      const maxFileSize = 5 * 1024 * 1024; // 5 MB

      // Validate file types and sizes
      for (const file of req.files) {
        if (!validFileTypes.includes(file.mimetype)) {
          return res.status(400).json({
            message: "Only JPEG, PNG,webp,jpg and PDF files are allowed.",
          });
        }
        if (file.size > maxFileSize) {
          return res.status(400).json({
            message: "File size cannot exceed 5MB.",
          });
        }
      }

      // Proceed with Cloudinary upload
      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer)
      );
      const results = await Promise.all(uploadPromises);
      imageUrls = results.map((r) => r.secure_url);
    }

    const newStatus = new ProjectStatus({
      projectName,
      statusDate,
      statusTitle,
      statusDetails,
      image: imageUrls, // store Cloudinary URLs
      sendSMS,
      sendEmail,
    });

    await newStatus.save();

    if (sendEmail) {
      const members = await Member.find({
        "propertyDetails.projectName": projectName,
      });

      if (!members || members.length === 0) {
        return res
          .status(404)
          .json({ message: `No members found for project ${projectName}` });
      }
      const emailsToSend = members
        .map((member) => member.email)
        .filter(Boolean);

      await sendProjectStatusEmails({
        projectName,
        statusTitle,
        statusDate,
        statusDetails,
        imageUrls,
        memberEmails: emailsToSend,
      });
    }

    res
      .status(201)
      .json({ message: "Project status added successfully", data: newStatus });
  } catch (error) {
    console.error("Error saving project status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getProjectStatus = async (req, res) => {
  try {
    const projectStatus = await ProjectStatus.find({});
    res.status(200).json({
      success: true,
      data: projectStatus,
    });
  } catch (error) {
    console.error("error fetching project status details:"),
      res.status(500).json({
        success: false,
        message: "Failed to fetch the project status details",
        error: error.message,
      });
  }
};

const deleteProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedStatus = await ProjectStatus.findByIdAndDelete(id);

    if (!deletedStatus) {
      return res
        .status(404)
        .json({ success: false, message: "Project status not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Project status deleted successfully." });
  } catch (err) {
    console.error("Error deleting project status:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getIndProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const projectStatus = await ProjectStatus.findById(id);

    if (!projectStatus) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }
    res.status(200).json({ success: true, data: projectStatus });
  } catch (error) {
    console.error("Error fetching project status by ID:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// In controller
const updateIndProjectStatus = async (req, res) => {
  try {
    const {
      projectName,
      statusDate,
      statusTitle,
      statusDetails,
      sendSMS,
      sendEmail,
      existingImages = [],
    } = req.body;

    let imageUrls = Array.isArray(existingImages)
      ? existingImages
      : [existingImages];

    // Validate and upload new files if any
    if (req.files && req.files.length > 0) {
      const validFileTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];
      const maxFileSize = 5 * 1024 * 1024;

      for (const file of req.files) {
        if (!validFileTypes.includes(file.mimetype)) {
          return res.status(400).json({
            message: "Only JPEG, PNG, WEBP, JPG, and PDF files are allowed.",
          });
        }
        if (file.size > maxFileSize) {
          return res.status(400).json({
            message: "File size cannot exceed 5MB.",
          });
        }
      }

      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer)
      );
      const results = await Promise.all(uploadPromises);
      const newUrls = results.map((r) => r.secure_url);
      imageUrls.push(...newUrls);
    }

    // If sending email, check and send
    if (sendEmail) {
      const members = await Member.find({
        "propertyDetails.projectName": projectName,
      });

      if (!members || members.length === 0) {
        return res.status(404).json({
          message: `No members found for project ${projectName}.`,
        });
      }

      const emailsToSend = members
        .map((member) => member.email)
        .filter(Boolean);

      await sendProjectStatusEmails({
        projectName,
        statusTitle,
        statusDate,
        statusDetails,
        imageUrls,
        memberEmails: emailsToSend,
      });
    }

    // Update the status in DB
    const updatedStatus = await ProjectStatus.findByIdAndUpdate(
      req.params.id,
      {
        projectName,
        statusDate,
        statusTitle,
        statusDetails,
        image: imageUrls,
        sendSMS,
        sendEmail,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Project status updated",
      data: updatedStatus,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const fetchTotalProjectsCount = async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    const totalRegMembers = await Member.countDocuments();
    res
      .status(200)
      .json({ totalProjects: totalProjects, totalRegMembers: totalRegMembers });
  } catch (err) {
    console.error("error fetching total projects count", err);
    res.status(500).json({ error: "Failed to fetch the total projects count" });
  }
};

export default {
  addProjectDetails,
  getProjectDetails,
  updateLandDetails,
  searchProjectName,
  postProjectStatus,
  getProjectStatus,
  deleteProjectStatus,
  getIndProjectStatus,
  updateIndProjectStatus,
  fetchTotalProjectsCount,
};
