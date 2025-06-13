import mongoose from "mongoose";
import Member from "../../model/memberModel.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";
import fs from "fs";
import Online from "../../model/onlineModel.js";
import nodemailer from "nodemailer";
import { transporter } from "../../utils/emailTransporter.js";
import Project from "../../model/projectModel.js";
import Receipt from "../../model/receiptModel.js";
import MemberContact from "../../model/memberContactModel.js";
import { generatePDFBuffer } from "../../utils/generatePDF.js";
import path from "path";
import { fileURLToPath } from "url";
import ejs from "ejs";

// import { transporter } from "../../utils/emailTransporter.js";
// import { Transaction } from "mongodb";

// import Member from "../../models/memberModels/memberModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
// Outside the function (global in-memory store)
const otpStore = {}; // email: otp

const sendOtpToEmail = async (req, res) => {
  console.log(req.body, "incoming email");
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
  otpStore[email] = otp;

  // Send via nodemailer
  await transporter.sendMail({
    from: `"Defence Housing Society" <${process.env.DHS_NODEMAILER_MAIL}>`,
    to: email,
    subject: "Your OTP Verification Code",
    text: `Your OTP is: ${otp}`,
  });

  res.json({ message: "OTP sent to email." });
};

const AddOnlineApplication = async (req, res) => {
  try {
    const data = req.fields;
    const files = req.files;
    // console.log(files, "incoming files");
    console.log(data, "incoming data");
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

    console.log(memberPhotoUrl, "imagesssssss");
    console.log(memberSignUrl, "imagesphoto");
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
      paymentType:data.paymentType,
      paymentMode:data.paymentMode,
      bankName:data.bankName,
      branchName:data.branchName,
      chequeNumber:data.chequeNumber,
      ddNumber:data.ddNumber,
      transactionId:data.transactionId,
      amount: Number(data.amount?.replace(/,/g, "")) || 0,
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

    // 1. Render EJS Template
    const templatePath = path.join(__dirname, "../../views/emailTemplate.ejs");
    const htmlContent = await ejs.renderFile(templatePath, mappedData);

    // 2. Convert to PDF
    const pdfBuffer = await generatePDFBuffer(htmlContent);

    // 3. Send Email with PDF
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.DHS_NODEMAILER_MAIL,
        pass: process.env.DHS_NODEMAILER_KEY,
      },
    });

    await transporter.sendMail({
      from: `"Defence Habitat Society" <${process.env.DHS_NODEMAILER_MAIL}>`,
      to: mappedData.email,
      subject: "Your Membership Application Receipt",
      text: "Please find attached your membership application PDF.",
      attachments: [
        {
          filename: "Membership_Application.pdf",
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    res.status(200).json({ success: true, message: "Application submitted successfully" });

  } catch (error) {
    console.error("Add Online Application Error:", error);
    res.status(500).json({ error: "Failed to submit online application." });
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
    if (!seniorityId) {
      return res
        .status(400)
        .json({ success: false, message: "Seniority id is required" });
    }

    const member = await Member.findOne({ SeniorityID: seniorityId });

    if (!member || !member.receiptId || member.receiptId.length === 0) {
      return res.status(404).json([]);
    }

    // console.log(member.receiptId)

    const receiptIds = member.receiptId;
    const receipts = await Receipt.find({ _id: { $in: receiptIds } });

    const extraCharges = [];

    receipts.forEach((receipt) => {
      receipt.payments.forEach((payment) => {
        if (payment.paymentType.toLowerCase() === "extra charge") {
          extraCharges.push({
            paymentId: payment._id,
            receiptId: receipt._id,
            receiptNo: payment.receiptNo,
            date: payment.date,
            paymentMode: payment.paymentMode,
            bankName: payment.bankName,
            branchName: payment.branchName,
            amount: payment.amount,
            otherCharges: payment.otherCharges || "",
            chequeNumber: payment.chequeNumber || "",
            ddNumber: payment.ddNumber || "",
            transactionId: payment.transactionId || "",
          });
        }
      });
    });

    res.status(200).json({ success: true, data: extraCharges });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const contactUs = async (req, res) => {
  try {
    const { name, phone, email, subject, message, location } = req.body;

    if (!name || !phone || !email || !subject) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Save to database
    const newContact = new MemberContact({
      name,
      phone,
      email,
      subject,
      message,
      location,
    });
    await newContact.save();

    // Send email
    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: `"Defence Habitat Housing Co-operative Society Ltd." <${process.env.DHS_NODEMAILER_MAIL}>`,
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #1f4892;">New Contact Us Submission</h2>
          <p style="font-size: 16px;">You have received a new message from the website contact form.</p>
          <hr style="margin: 20px 0;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
        ${location ? `<p><strong>Location:</strong> ${location}</p>` : ""}
          ${
            message
              ? `<p><strong>Message:</strong><br>${message.replace(
                  /\n/g,
                  "<br>"
                )}</p>`
              : ""
          }
          <hr style="margin: 20px 0;">
          <p style="color: gray; font-size: 12px;">This message was submitted through the Defence Housing Society contact form.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: "Message sent successfully.",
    });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

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
    console.log(applications, "online data application");

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

const verifyOtp = async (req, res) => {
  console.log("funciton is calling ", req.body);

  const { email, otp } = req.body;
  console.log(otpStore, "otp storeeee");

  if (otpStore[email] && otpStore[email] == otp) {
    delete otpStore[email]; // ✅ Remove after success
    return res.json({ success: true });
  } else {
    console.log('else block is calling');
    
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }
};

const getOnlineApplicationById = async (req, res) => {
  // console.log(req.params, "incomign information");
  try {
    const application = await Online.findById(req.params.id);
    // console.log(application, "application");
    if (!application)
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    res.json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const memberDashBoardContactAdmin = async (req, res) => {
  try {
    const { seniorityId, subject, message } = req.body;
    if (!seniorityId) {
      return res.status(400).json({ error: "Seniority ID is required" });
    }
    // Find member details based on seniorityId
    const member = await Member.findOne({ SeniorityID: seniorityId })
      .select("name email mobileNumber")
      .lean();
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }
    // Create email content
    const mailOptions = {
      from: `"Member Panel Contact Form" <${member.name}>`,
      to: `"Defence Habitat Housing Co-operative Society Ltd." <${process.env.DHS_NODEMAILER_MAIL}>`,
      subject: `Contact Admin: ${subject}`,
      html: `
        <h2>New Contact Form Submission From Member Panel</h2>
        <p><strong>From:</strong> ${member.name} (Seniority ID: ${seniorityId})</p>
        <p><strong>Member Email:</strong> ${member.email}</p>
        <p><strong>Member Mobile:</strong> ${member.mobileNumber}</p>
        <hr>
        <h3>Message:</h3>
        <p>${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Your message has been sent successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error occurred while processing your request",
    });
  }
};


const GetTrnasferedhistory = async (req, res) => {
  try {
    const seniorityId = req.params.id;

    console.log("Received seniorityId:", seniorityId);

    // Find all records with the same SeniorityID and isTransferred set to true
    const transferredMembers = await Member.find({
      SeniorityID: seniorityId,
      isTransferred: true,
    });

    console.log("Transferred Members:", transferredMembers);

    if (!transferredMembers || transferredMembers.length === 0) {
      return res
        .status(404)
        .json({ message: "No transfer history found for this member." });
    }

    res.status(200).json(transferredMembers);
  } catch (error) {
    console.error("Get Transfer History Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


export const sendDownloadNotificationEmail = async ({
  name,
  email,
  mobile,
  address,
  type = "Application", // default to Application
}) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.DHS_NODEMAILER_MAIL,
        pass: process.env.DHS_NODEMAILER_KEY,
      },
    });

    const mailOptions = {
      from: '"DHS Admin" <yourcompanyemail@gmail.com>',
      to: "mail@defencehousingsociety.com",
      subject: `New ${type} Downloaded`,
      html: `
        <h3>New ${type} Downloaded</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Mobile:</strong> ${mobile}</p>
        <p><strong>Address:</strong> ${address}</p>
      `,
    };
    await transporter.sendMail(mailOptions);
    console.log(`📨 Email notification sent for ${type} download.`);
  } catch (error) {
    console.error(`❌ Failed to send ${type} email:`, error);
  }
};

export default {
  memberLogin,
  dashboardDatas,
  fetchUserData,
  fetchReceipts,
  fetchProjectStatus,
  extraChargeReceipts,
  contactUs,
  getOnlineApplications,
  verifyOtp,
  getOnlineApplicationById,
  AddOnlineApplication,
  sendOtpToEmail,
  memberDashBoardContactAdmin,
  GetTrnasferedhistory,
  
};
