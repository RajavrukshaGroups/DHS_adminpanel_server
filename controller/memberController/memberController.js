
import Member from "../../model/memberModel.js"; // adjust path as needed
import upload from "../../middleware/multer.js";
import MemberAffidavit from '../../model/memberAffidavit.js'; // adjust path as needed

import { uploadToCloudinary } from "../../utils/cloudinary.js"; // adjust path as needed
import {generateUniquePassword} from "../../utils/generatePassword.js";
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
      const result = await uploadToCloudinary(photoFile.buffer || photoFile.path);
      memberPhotoUrl = result.secure_url;
    }

    if (files?.memberSign) {
      const signFile = files.memberSign;
      const result = await uploadToCloudinary(signFile.buffer || signFile.path);
      memberSignUrl = result.secure_url;
    }
    const plainPassword =await generateUniquePassword(); 

     console.log(memberPhotoUrl,'memberPhotoUrl')
     console.log(memberSignUrl,'memberSignUrl')

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
      password:plainPassword,
      nomineeName: data.nomineeName,
      nomineeAge: Number(data.nomineeAge),
      nomineeRelation: data.nomineeRelationship,
      nomineeAddress: data.nomineeAddress,
      SeniorityID: data.seniorityId,
      MembershipNo: data.membershipNo,
      ConfirmationLetterNo: data.cunfirmationLetterNo,
      ShareCertificateNumber: data.shareCertificateNo,
      ReceiptNo: data.recieptNo,
      date: new Date(data.date),
      NoofShares: Number(data.numberOfShares),
      ShareFee: Number(data.shareFee),
      MembershipFee: Number(data.memberShipFee),
      ApplicationFee: Number(data.applicationFee),
      AdmissionFee: Number(data.adminissionFee),
      MiscellaneousExpenses: Number(data.miscellaneousExpenses),
      PaymentType: data.paymentType,
      PaymentMode: data.paymentMode,
      BankName: data.bankName,
      BranchName: data.branchName,
      Amount: Number(data.amount),
      DDNumber: "", // You can update this if needed
      propertyDetails: {
        projectName: data.projectName || "",
        propertySize: Number(data.PropertySize) || 0,
        pricePerSqft: Number(data.perSqftPropertyPrice) || 0,
        propertyCost: Number(data.selectedPropertyCost?.replace(/,/g, "")) || 0,
        percentage: Number(data.percentage) || 0,
        percentageCost: Number(data.percentageCost?.replace(/,/g, "")) || 0,
        length: Number(data.plotLength) || 0,
        breadth: Number(data.plotBreadth) || 0
      }
    };

    const newMember = new Member(mappedData);
    await newMember.save();

    res.status(201).json({ message: "Member saved successfully!" });

  } catch (error) {
    console.error("Add Member Error:", error);
    res.status(500).json({ error: "Failed to save member." });
  }
};

const getMemberDetails =async(req,res)=>{
  try{
    console.log("Fetching member details...");
    const members = await Member.find({});
    console.log("Fetched members:", members);
    res.status(200).json({
      success: true,
      data: members,
    });
  }catch(error){
    console.log(error.message)
  }
}

const checkDuplicates = async (req, res) => {
  console.log("Checking for duplicates...");
  console.log("📥 Incoming query:", req.query);
  const {
    SeniorityID,
    MembershipNo,
    ConfirmationLetterNo,
    ShareCertificateNumber
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
          ConfirmationLetterNo: existing.ConfirmationLetterNo === ConfirmationLetterNo,
          ShareCertificateNumber: existing.ShareCertificateNumber === ShareCertificateNumber
        }
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
    const member = await Member.findByIdAndUpdate(req.params.id, {
      isActive: req.body.isActive
    }, { new: true });

    res.status(200).json(member);
  } catch (error) {
    res.status(500).json({ error: "Failed to update status" });
  }
}

const getInactiveMembers = async (req, res) => {
  try {
    console.log('Fetching inactive members...');
    
    const inactiveMembers = await Member.find({ isActive: false });
    console.log(inactiveMembers,'inactive members');
    
    res.status(200).json(inactiveMembers);
  } catch (err) {
    console.error('Error fetching inactive members:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

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
}
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
}
const getAllAffidavits = async (req, res) => {
  try {
    const data = await MemberAffidavit.find()
      .populate("userId", "refname name email mobileNumber SeniorityID ReceiptNo Amount") // adjust fields as needed
      .sort({ createdAt: -1 });
      console.log(data,'ddddddddddddddddd');
      
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching affidavits:", error);
    res.status(500).json({ message: "Failed to fetch affidavits" });
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
  getAllAffidavits
};
