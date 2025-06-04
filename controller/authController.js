import Admin from "../model/authModel.js";
import MemberContact from "../model/memberContactModel.js";

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body, "Incoming data");
    // Check if admin already exists
    const AdminEmail = await Admin.findOne({ email });
    console.log(AdminEmail, "Admin credentials");
    if (!AdminEmail) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect email ID" });
    } else if (password !== AdminEmail.password) {
      return res
        .status(400)
        .json({ success: false, message: "Incorrect password" });
    }
    console.log("login successful");
    res.status(200).json({ success: true, message: "Login Success" });
  } catch (error) {
    console.error("Error during login:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const contactedMembers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    // Build search filter
    const searchFilter = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ],
    };

    const total = await MemberContact.countDocuments(searchFilter);
    const contacts = await MemberContact.find(searchFilter)
      .sort({ _id: 1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: contacts,
      pagination: {
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching contact members:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export default { adminLogin, contactedMembers };
