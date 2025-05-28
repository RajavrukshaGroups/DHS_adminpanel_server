import mongoose from "mongoose";
import initData from "./logindata.js";
import memberDetails from "./memberData.js";
import AdminLogin from "../model/authModel.js";
import MemberModel from "../model/memberModel.js";
import ReceiptModel from "../model/receiptModel.js";
import MemberAffidavit from "../model/memberAffidavit.js";
import plotTransfer from "../model/plotTransfer.js";

// const MONGO_URL = "mongodb://127.0.0.1:27017/plumeria";
const MONGO_URL = "mongodb://127.0.0.1:27017/DHS-Admin";

const main = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to database");

    // await Listing.deleteMany({});
    // await Booking.deleteMany({});
    // await AdminLogin.insertMany(initData);
    // await MemberModel.insertMany(memberDetails);
    await MemberModel.deleteMany({});
    await ReceiptModel.deleteMany({});
    await plotTransfer.deleteMany({});
    await MemberAffidavit.deleteMany({});
    // await RoomAvailability.deleteMany({});
    // await RoomAvailability.insertMany(roomAvailabilityData);
    // await Admin.insertMany(adminLogs);
    // await Booking.insertMany(bookingsData);
    console.log("Database initialized with room data.");

    mongoose.connection.close(); // Close DB connection
  } catch (error) {
    console.error("Error:", error);
    mongoose.connection.close();
  }
};

main();
