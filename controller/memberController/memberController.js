
import Member from "../../model/memberModel.js"; // adjust path as needed

 const addMemberDetails = async (req, res) => {
  try {
    const data = req.body;
      console.log("Received data:", data);
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
      MemberPhoto: "", // handle file uploads separately
      MemberSign: "", // handle file uploads separately
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
      BranchName: data.brnachName,
      Amount: Number(data.amount),
      DDNumber: "", // if any
      propertyDetails: {
        projectName: data.projectName || "",
        plotNumber: data.plotNumber || "NA",  // avoid validation error
        dimension: {
          length: Number(data.length) || 0,   // fallback to 0 if undefined
          breadth: Number(data.breadth) || 0
        },
        pricePerSqft: Number(data.pricePerSqft) || 0,
        propertyCost: Number(data.propertyCost?.replace(/,/g, "")) || 0 // remove commas like '20,98,500.00'
      }
      
      // propertyDetails: {
      //   projectName: data.projectName,
      //   plotNumber: data.plotNumber,
      //   dimension: {
      //     length: Number(data.length),
      //     breadth: Number(data.breadth)
      //   },
      //   pricePerSqft: Number(data.pricePerSqft),
      //   propertyCost: Number(data.propertyCost)
      // }
    };

    const newMember = new Member(mappedData);
    await newMember.save();

    res.status(201).json({ message: "Member saved successfully!" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save member." });
  }
};

export default {
    addMemberDetails
}