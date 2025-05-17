import mongoose from "mongoose" ;

const adminSchema = new mongoose.Schema({
    email: {
      type: String,
    },
    password: {
      type: String,
    },
  });
  const Admin = mongoose.model("adminLogin",adminSchema)

  export default Admin
