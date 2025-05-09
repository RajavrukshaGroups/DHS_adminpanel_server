
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

export default {
  addMemberDetails,
  getMemberDetails
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