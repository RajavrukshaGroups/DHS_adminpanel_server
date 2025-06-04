import mongoose from "mongoose";
import Member from "../../model/memberModel.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";
import fs from "fs";
import Online from "../../model/onlineModel.js";
import nodemailer from "nodemailer";
import { transporter } from "../../utils/emailTransporter.js";

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
// Outside the function (global in-memory store)
const otpStore = {}; // email: otp


const sendOtpToEmail = async (req, res) => {
  console.log(req.body,'incoming email')
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
  otpStore[email] = otp;

  // Send via nodemailer
  await transporter.sendMail({
    from: `"Defence Housing Society" <${process.env.DHS_NODEMAILER_MAIL}>`,
    to: email,
    subject: 'Your OTP Verification Code',
    text: `Your OTP is: ${otp}`,
  });

  res.json({ message: 'OTP sent to email.' });
};



const AddOnlineApplication = async (req, res) => {
  try {
    const data =req.fields
    const files = req.files;
    console.log(files,'incoming files')
    let memberPhotoUrl = "";
    let memberSignUrl = "";
    
    // ✅ Handle memberPhoto
   if (files?.memberPhoto) {
      const photoFile = files.memberPhoto;
      const result = await uploadToCloudinary(
        photoFile.buffer || photoFile.path
      );
      memberPhotoUrl = result.secure_url;
    }

    // ✅ Handle memberSign 
      if (files?.memberSign) {
      const signFile = files.memberSign;
      const result = await uploadToCloudinary(signFile.buffer || signFile.path);
      memberSignUrl = result.secure_url;
    }
    

    console.log(memberPhotoUrl,'imagesssssss')
    console.log(memberSignUrl,'imagesphoto')
    // Generate password
    // const plainPassword = await generateUniquePassword();
    const mappedData = {
      refname: data.refencName,
      rankDesignation: data.rankDesignation,
      serviceId: data.ServiceId,
      relationship: data.relationship,
      saluation: data.salutation,
      name: data.name,
      mobileNumber: Number(data.mobile),
      AlternativeNumber: Number(data.altMobile) || undefined,
      email: data.email,
      dateofbirth: new Date(data.dob),
      fatherName: data.fatherSpouse,
      contactAddress: data.correspondenceAddress,
      permanentAddress: data.permanentAddress,
      workingAddress: data.workingAddress,
      MemberPhoto: memberPhotoUrl,
      MemberSign: memberSignUrl,
      nomineeName: data.nomineeName,
      nomineeAge: Number(data.nomineeAge),
      nomineeRelation: data.nomineeRelationship,
      nomineeAddress: data.nomineeAddress,
      date: data.date ? new Date(data.date) : new Date(),
      propertyDetails: {
        projectName: data.projectName || "",
        propertySize: Number(data.PropertySize) || 0,
        pricePerSqft: Number(data.perSqftPropertyPrice) || 0,
        propertyCost: Number(data.selectedPropertyCost?.replace(/,/g, "")) || 0,
        percentage: Number(data.percentage) || 0,
        percentageCost: Number(data.percentageCost?.replace(/,/g, "")) || 0,
        length: Number(data.plotLength) || 0,
        breadth: Number(data.plotBreadth) || 0,
        paidAmount: Number(data.sitedownpaymentamount || 0),
      },
    };
    const newOnlineApplication = new Online(mappedData);
    await newOnlineApplication.save();
    // You can optionally save payment details in a separate model if needed:
    // await savePaymentDetails(data, newOnlineApplication._id);
    res.status(201).json({ message: "Online application submitted successfully." });
  } catch (error) {
    console.error("Add Online Application Error:", error);
    res.status(500).json({ error: "Failed to submit online application." });
  }
};
// export default memberLogin;

const getOnlineApplications = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;
    const query = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { seniorityID: { $regex: search, $options: "i" } },
      ],
    };

    const totalApplications = await Online.countDocuments(query);
    const applications = await Online.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
      console.log(applications,'online data application')

    res.json({
      success: true,
      data: applications,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalApplications / limit),
    });
  } catch (error) {
    console.error("Get Online Applications Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const verifyOtp =async(req,res)=>{
  console.log('funciton is calling ',req.body);
  
  const { email, otp } = req.body;
console.log(otpStore,'otp storeeee')
  
  if (otpStore[email] && otpStore[email] == otp) {
    delete otpStore[email]; // ✅ Remove after success
    return res.json({ success: true });
  } else {
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }
}

const getOnlineApplicationById = async (req, res) => {
  console.log(req.params,'incomign information')
  try {
    const application = await Online.findById(req.params.id);
    console.log(application,'application')
    if (!application) return res.status(404).json({ success: false, message: "Application not found" });
    res.json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export default {
    memberLogin,
    dashboardDatas,
    AddOnlineApplication,
    getOnlineApplications,
    sendOtpToEmail,
    verifyOtp,
    getOnlineApplicationById
}