import Admin from "../model/authModel.js";


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

export default  {adminLogin}