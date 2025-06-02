import mongoose from "mongoose";
import Member from "../../model/memberModel.js";
import Project from "../../model/projectModel.js";

// import Member from "../../models/memberModels/memberModel.js";

const memberLogin = async (req, res) => {
  console.log("Login function called");

  try {
    const { seniority_id, password } = req.body;
    console.log("Incoming Data:", req.body);

    const memberData = await Member.findOne({ SeniorityID: seniority_id });

    if (!memberData) {
      return res
        .status(400)
        .json({ success: false, message: "Seniority ID not found" });
    }

    if (password !== memberData.password) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect password" });
    }

    // Login successful
    console.log("Login successful for", seniority_id);

    return res.status(200).json({
      success: true,
      seniority_id: memberData.SeniorityID,
      message: "Login successful",
      // Adjust according to your frontend route
    });
  } catch (error) {
    console.error("Error during login:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const dashboardDatas = async (req, res) => {
  const seniorityId = req.params.id;
  try {
    const memberData = await Member.findOne({ SeniorityID: seniorityId });
    console.log(memberData, "incoming member datas");
    if (!memberData) {
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });
    }

    res.status(200).json({ success: true, data: memberData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// export default memberLogin;

const fetchUserData = async (req, res) => {
  // const seniorityId = req.params.seniorityId;
  const seniorityId = req.query.seniority_id; // not req.params
  try {
    const member = await Member.findOne({ SeniorityID: seniorityId });

    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });
    }

    res.status(200).json([member]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "server error" });
  }
};

const fetchReceipts = async (req, res) => {
  const seniorityId = req.query.seniority_id;

  try {
    if (!seniorityId) {
      return res
        .status(400)
        .json({ success: false, message: "seniority id is required" });
    }

    const member = await Member.findOne({ SeniorityID: seniorityId }).populate(
      "receiptId"
    );
    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Receipts fetched successfully",
      data: member.receiptId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "server error" });
  }
};

const fetchProjectStatus = async (req, res) => {
  const seniorityId = req.query.seniority_id;

  try {
    if (!seniorityId) {
      return res
        .status(400)
        .json({ success: false, message: "Seniority ID is required" });
    }

    // Step 1: Find the member using the seniorityId
    const member = await Member.findOne({ SeniorityID: seniorityId });

    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });
    }

    const projectName = member.propertyDetails?.projectName;

    if (!projectName) {
      return res.status(404).json({
        success: false,
        message: "Project name not found in member data",
      });
    }

    // Step 2: Find the project using the extracted project name
    const project = await Project.findOne({ projectName: projectName });

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    res.json([project]); // Send as an array so frontend map works
  } catch (error) {
    console.error("Error fetching project status:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const extraChargeReceipts = async (req, res) => {
  const seniorityId = req.query.seniority_id;
  try {
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export default {
  memberLogin,
  dashboardDatas,
  fetchUserData,
  fetchReceipts,
  fetchProjectStatus,
  extraChargeReceipts,
};
