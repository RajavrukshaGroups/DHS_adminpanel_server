
import Member from "../../model/memberModel.js"; // adjust path as needed

// import Member from "../../model/memberModel.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js"; // adjust path as needed

const addMemberDetails = async (req, res) => {
  try {
    const data = req.fields;
    const files = req.files;
    // console.log("Received data:", data);
    console.log("Received files:", files);

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
        percentageCost: Number(data.percentageCost?.replace(/,/g, "")) || 0
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

// const check_seniority = async (req, res) => { 

//   console.log("Checking seniority ID:", req.params.id);
//   const seniorityID = req.params.id;
//   const existing = await Member.findOne({ SeniorityID: seniorityID });
//   console.log("Existing member with seniority ID:", existing);
  
//   if (existing) {
//     return res.status(200).json({ exists: true });
//   } else {
//     return res.status(200).json({ exists: false });
//   }
// }
// Route: /member/check-duplicates

// const check_duplicates = async (req, res) => {
//   console.log("Checking for duplicates...");
//   const { seniorityID, membershipNo, cunfirmationLetterNo, shareCertificateNo } = req.body;
//   const results = {
//     seniorityID: false,
//     membershipNo: false,
//     cunfirmationLetterNo: false,
//     shareCertificateNo: false,
//   };

//   if (seniorityID) {
//     const seniorityExists = await Member.findOne({ SeniorityID: seniorityID });
//     if (seniorityExists) results.seniorityID = true;
//   }

//   if (membershipNo) {
//     const membershipExists = await Member.findOne({ membershipNo: membershipNo });
//     if (membershipExists) results.membershipNo = true;
//   }

//   if (cunfirmationLetterNo) {
//     const confirmationExists = await Member.findOne({ cunfirmationLetterNo: cunfirmationLetterNo });
//     if (confirmationExists) results.cunfirmationLetterNo = true;
//   }

//   if (shareCertificateNo) {
//     const shareExists = await Member.findOne({ shareCertificateNo: shareCertificateNo });
//     if (shareExists) results.shareCertificateNo = true;
//   }
//   return res.status(200).json(results);
// };


const checkDuplicates = async (req, res) => {
  const { seniorityID, membershipNo, confirmationLetterNo, shareCertificateNo } = req.query;

  let query = {
    $or: [
      { SeniorityID: seniorityID },
      { membershipNo: membershipNo },
      { cunfirmationLetterNo: confirmationLetterNo },
      { shareCertificateNo: shareCertificateNo }
    ]
  };

  try {
    const existing = await Member.findOne(query);

    if (existing) {
      return res.status(200).json({
        exists: true,
        fields: {
          SeniorityID: existing.SeniorityID === seniorityID,
          membershipNo: existing.membershipNo == membershipNo,
          cunfirmationLetterNo: existing.cunfirmationLetterNo == confirmationLetterNo,
          shareCertificateNo: existing.shareCertificateNo == shareCertificateNo
        }
      });
    }

    res.status(200).json({ exists: false, fields: {} });
  } catch (err) {
    console.error("Error checking duplicates:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default {
  addMemberDetails,
  getMemberDetails,
  checkDuplicates
  // check_duplicates
};

//  const addMemberDetails = async (req, res) => {
//   try {

//     // const data = req.body;
//     const data =req.fields
//     console.log("Received data:", data);
//     console.log("Received files:", req.files);
//     let memberPhotoUrl = "";
//     let memberSignUrl = "";
//       console.log("Received data:", data);
//       if (req.files) {
//         if (req.files.memberPhoto && req.files.memberPhoto[0]) {
//           const result = await uploadToCloudinary(req.files.memberPhoto[0].buffer);
//           memberPhotoUrl = result.secure_url;
//         }

//         if (req.files.memberSign && req.files.memberSign[0]) {
//           const result = await uploadToCloudinary(req.files.memberSign[0].buffer);
//           memberSignUrl = result.secure_url;
//         }
//       }

//     const mappedData = {
//       refname: data.refencName,
//       rankDesignation: data.rankDesignation,
//       serviceId: data.ServiceId,
//       relationship: data.relationship,
//       saluation: data.salutation,
//       name: data.name,
//       mobileNumber: Number(data.mobile),
//       AlternativeNumber: Number(data.altMobile),
//       email: data.email,
//       dateofbirth: new Date(data.dob),
//       fatherName: data.fatherSpouse,
//       contactAddress: data.correspondenceAddress,
//       permanentAddress: data.permanentAddress,
//       workingAddress: data.workingAddress,
//       MemberPhoto: memberPhotoUrl, // handle file uploads separately
//       MemberSign: memberSignUrl, // handle file uploads separately
//       nomineeName: data.nomineeName,
//       nomineeAge: Number(data.nomineeAge),
//       nomineeRelation: data.nomineeRelationship,
//       nomineeAddress: data.nomineeAddress,
//       SeniorityID: data.seniorityId,
//       MembershipNo: data.membershipNo,
//       ConfirmationLetterNo: data.cunfirmationLetterNo,
//       ShareCertificateNumber: data.shareCertificateNo,
//       ReceiptNo: data.recieptNo,
//       date: new Date(data.date),
//       NoofShares: Number(data.numberOfShares),
//       ShareFee: Number(data.shareFee),
//       MembershipFee: Number(data.memberShipFee),
//       ApplicationFee: Number(data.applicationFee),
//       AdmissionFee: Number(data.adminissionFee),
//       MiscellaneousExpenses: Number(data.miscellaneousExpenses),
//       PaymentType: data.paymentType,
//       PaymentMode: data.paymentMode,
//       BankName: data.bankName,
//       BranchName: data.brnachName,
//       Amount: Number(data.amount),
//       DDNumber: "", // if any
//       propertyDetails: {
//         projectName: data.projectName || "",
//         propertySize: Number(data.PropertySize) || 0,
//         pricePerSqft: Number(data.perSqftPropertyPrice) || 0,
//         propertyCost: Number(data.selectedPropertyCost?.replace(/,/g, "")) || 0,
//         percentage: Number(data.percentage) || 0,
//         percentageCost: Number(data.percentageCost?.replace(/,/g, "")) || 0
//       }
//     };

//     const newMember = new Member(mappedData);
//     await newMember.save();

//     res.status(201).json({ message: "Member saved successfully!" });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Failed to save member." });
//   }
// };

// export default {
//     addMemberDetails
// }