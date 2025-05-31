import mongoose from "mongoose";
import Member from "../../model/memberModel.js";

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
    console.log(memberData,'incoming member datas')
    if (!memberData) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    res.status(200).json({ success: true, data: memberData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// export default memberLogin;


export default {
    memberLogin,
    dashboardDatas
}