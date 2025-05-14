import Member from "../../model/memberModel.js"; // adjust path as needed
import Receipt from "../../model/receiptModel.js";
import upload from "../../middleware/multer.js";
import MemberAffidavit from "../../model/memberAffidavit.js"; // adjust path as needed
import { uploadToCloudinary } from "../../utils/cloudinary.js"; // adjust path as needed
import { generateUniquePassword } from "../../utils/generatePassword.js";
import { transporter } from "../../utils/emailTransporter.js";
import { createReceipt } from "../receiptController/receiptController.js";

const addMemberDetails = async (req, res) => {
  try {
    const data = req.fields;
    const files = req.files;
    console.log("Received files:", files);
    console.log("Received data:", data);

    let memberPhotoUrl = "";
    let memberSignUrl = "";

    if (files?.memberPhoto) {
      const photoFile = files.memberPhoto;
      const result = await uploadToCloudinary(
        photoFile.buffer || photoFile.path
      );
      memberPhotoUrl = result.secure_url;
    }

    if (files?.memberSign) {
      const signFile = files.memberSign;
      const result = await uploadToCloudinary(signFile.buffer || signFile.path);
      memberSignUrl = result.secure_url;
    }
    const plainPassword = await generateUniquePassword();

    console.log(memberPhotoUrl, "memberPhotoUrl");
    console.log(memberSignUrl, "memberSignUrl");

    const mappedData = {
      refname: data.refencName,
      rankDesignation: data.rankDesignation,
      serviceId: data.ServiceId,
      relationship: data.relationship,
      saluation: data.salutation,
      name: data.name,
      mobileNumber: Number(data.mobile),
      AlternativeNumber: Number(data.altMobile),
      email: data.email,
      dateofbirth: new Date(data.dob),
      fatherName: data.fatherSpouse,
      contactAddress: data.correspondenceAddress,
      permanentAddress: data.permanentAddress,
      workingAddress: data.workingAddress,
      MemberPhoto: memberPhotoUrl,
      MemberSign: memberSignUrl,
      password: plainPassword,
      nomineeName: data.nomineeName,
      nomineeAge: Number(data.nomineeAge),
      nomineeRelation: data.nomineeRelationship,
      nomineeAddress: data.nomineeAddress,
      SeniorityID: data.seniorityId,
      MembershipNo: data.membershipNo,
      ConfirmationLetterNo: data.cunfirmationLetterNo,
      ShareCertificateNumber: data.shareCertificateNo,
      // ReceiptNo: data.recieptNo,
      date: new Date(data.date),
      // NoofShares: Number(data.numberOfShares),
      // ShareFee: Number(data.shareFee),
      // MembershipFee: Number(data.memberShipFee),
      // ApplicationFee: Number(data.applicationFee),
      // AdmissionFee: Number(data.adminissionFee),
      // MiscellaneousExpenses: Number(data.miscellaneousExpenses),
      // PaymentType: data.paymentType,
      // PaymentMode: data.paymentMode,
      // BankName: data.bankName,
      // BranchName: data.branchName,
      // Amount: Number(data.amount),
      DDNumber: "",
      propertyDetails: {
        projectName: data.projectName || "",
        propertySize: Number(data.PropertySize) || 0,
        pricePerSqft: Number(data.perSqftPropertyPrice) || 0,
        propertyCost: Number(data.selectedPropertyCost?.replace(/,/g, "")) || 0,
        percentage: Number(data.percentage) || 0,
        percentageCost: Number(data.percentageCost?.replace(/,/g, "")) || 0,
        length: Number(data.plotLength) || 0,
        breadth: Number(data.plotBreadth) || 0,
      },
    };

    const newMember = new Member(mappedData);
    await newMember.save();

    await createReceipt(newMember._id, data);
    res.status(201).json({ message: "Member saved successfully!" });
  } catch (error) {
    console.error("Add Member Error:", error);
    res.status(500).json({ error: "Failed to save member." });
  }
};

const getMemberDetails = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { SeniorityID: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const totalMembers = await Member.countDocuments(query);
    const members = await Member.find(query).skip(skip).limit(limit);

    if (search && members.length === 0) {
      
      return res.status(404).json({
        success: false,
        message: `No members found matching ${search}`,
        data: [],
        currentPage: page,
        totalPages: 0,
        totalMembers: 0,
      });
    }
    res.status(200).json({
      success: true,
      data: members,
      currentPage: page,
      totalPages: Math.ceil(totalMembers / limit),
      totalMembers,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, error: "server error" });
  }
};

const checkDuplicates = async (req, res) => {
  console.log("Checking for duplicates...");
  console.log("📥 Incoming query:", req.query);
  const {
    SeniorityID,
    MembershipNo,
    ConfirmationLetterNo,
    ShareCertificateNumber,
  } = req.query;

  // Build query based on available fields
  let orConditions = [];
  if (SeniorityID) orConditions.push({ SeniorityID });
  if (MembershipNo) orConditions.push({ MembershipNo });
  if (ConfirmationLetterNo) orConditions.push({ ConfirmationLetterNo });
  if (ShareCertificateNumber) orConditions.push({ ShareCertificateNumber });

  if (orConditions.length === 0) {
    return res.status(400).json({ error: "No valid fields provided" });
  }

  try {
    const existing = await Member.findOne({ $or: orConditions });
    console.log("Existing member with query:", existing);

    if (existing) {
      return res.status(200).json({
        exists: true,
        fields: {
          SeniorityID: existing.SeniorityID === SeniorityID,
          MembershipNo: existing.MembershipNo === MembershipNo,
          ConfirmationLetterNo:
            existing.ConfirmationLetterNo === ConfirmationLetterNo,
          ShareCertificateNumber:
            existing.ShareCertificateNumber === ShareCertificateNumber,
        },
      });
    }

    return res.status(200).json({ exists: false, fields: {} });
  } catch (err) {
    console.error("❌ Error checking duplicates:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateStatus = async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(
      req.params.id,
      {
        isActive: req.body.isActive,
      },
      { new: true }
    );

    res.status(200).json(member);
  } catch (error) {
    res.status(500).json({ error: "Failed to update status" });
  }
};

const getInactiveMembers = async (req, res) => {
  try {
    console.log("Fetching inactive members...");

    const inactiveMembers = await Member.find({ isActive: false });
    console.log(inactiveMembers, "inactive members");

    res.status(200).json(inactiveMembers);
  } catch (err) {
    console.error("Error fetching inactive members:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const getConfirmation = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }
    res.status(200).json(member);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
const addConfirmation = async (req, res) => {
  try {
    console.log("Received file:", req.file);
    console.log("Received body:", req.body);
    console.log("Received params:", req.params);
    const { id } = req.params;
    const result = await uploadToCloudinary(req.file.buffer);
    const affidavitUrl = result.secure_url;
    // Use the URL along with other form fields
    const newAffidavit = new MemberAffidavit({
      userId: req.params.id,
      projectAddress: req.body.projectAddress,
      chequeNo: req.body.ChequeNo,
      duration: req.body.Duration,
      affidavitUrl: result.secure_url,
      cloudinaryId: result.public_id,
    });
    await newAffidavit.save();
    // Example: save to database
    // await updateMember(id, memberData);
    res.status(200).json({
      message: "Affidavit uploaded successfully",
      data: newAffidavit,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload affidavit" });
  }
};
const getAllAffidavits = async (req, res) => {
  try {
    const data = await MemberAffidavit.find()
      .populate(
        "userId",
        "refname name email mobileNumber SeniorityID ReceiptNo Amount"
      ) // adjust fields as needed
      .sort({ createdAt: -1 });
    console.log(data, "ddddddddddddddddd");

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching affidavits:", error);
    res.status(500).json({ message: "Failed to fetch affidavits" });
  }
};
const sendMemberLoginDetails = async (req, res) => {
  try {
    const { name, email, SeniorityID, password } = req.body;

    // Validate input
    if (!name || !email || !SeniorityID || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const mailOptions = {
      from: `"Defence Habitat Housing Co-operative Society Ltd." <${process.env.DHS_NODEMAILER_MAIL}>`,
      to: email,
      subject: "Member Login Credentials",
      html: `
        <div style="border:1px solid #1f4892; font-family: Arial, sans-serif;">
          <div style="background-color: #1f4892; height: 50px;"></div>
          <div style="padding: 20px;">
            <p>Dear <strong>${name}</strong>,</p>
            <p>From,<br>Defence Habitat Housing Co-operative Society Ltd.</p>
            <table cellpadding="10">
              <tr>
                <td style="background-color: #666; color: white;"><strong>Member ID</strong></td>
                <td><div style="border: 1px solid #ccc; padding: 8px;">${SeniorityID}</div></td>
              </tr>
              <tr>
                <td style="background-color: #666; color: white;"><strong>Email</strong></td>
                <td><div style="border: 1px solid #ccc; padding: 8px;">${email}</div></td>
              </tr>
              <tr>
                <td style="background-color: #666; color: white;"><strong>Password</strong></td>
                <td><div style="border: 1px solid #ccc; padding: 8px;">${password}</div></td>
              </tr>
            </table>
            <p>Click here to login: <a href="https://defencehousingsociety.com/memberlogin">https://defencehousingsociety.com/memberlogin</a></p>
            <p><strong>THANK YOU</strong></p>
            <p><strong>For further details, contact</strong><br>
            Behind Swathi Garden Hotel<br>
            E Block, Sahakarnagar,<br>
            Bengaluru - 560 092. Ph: 080 - 29903931</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: `Login credentials shared to ${email} successfully`,
    });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
};

// Exporting all the functions
const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedMember = await Member.findByIdAndDelete(id);
    if (!deletedMember) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.status(200).json({ message: "Member deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Server error while deleting member" });
  }
};

export default {
  addMemberDetails,
  getMemberDetails,
  checkDuplicates,
  updateStatus,
  getInactiveMembers,
  getConfirmation,
  addConfirmation,
  getAllAffidavits,
  sendMemberLoginDetails,
  deleteMember,
};
