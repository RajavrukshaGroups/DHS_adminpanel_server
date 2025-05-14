// receiptController.js
import Receipt from "../../model/receiptModel.js";
import Member from "../../model/memberModel.js";

export const createReceipt = async (memberId, data) => {
  try {
    const receiptData = {
      member: memberId,
      receiptNo: data.recieptNo,
      date: new Date(data.date),
      noOfShares: Number(data.numberOfShares),
      shareFee: Number(data.shareFee),
      membershipFee: Number(data.memberShipFee),
      applicationFee: Number(data.applicationFee),
      admissionFee: Number(data.adminissionFee),
      miscellaneousExpenses: Number(data.miscellaneousExpenses),
      paymentType: data.paymentType,
      paymentMode: data.paymentMode,
      bankName: data.bankName,
      branchName: data.branchName,
      amount: Number(data.amount),
    };

    const receipt = new Receipt(receiptData);
    await receipt.save();

    // Push the created receipt's ID into the member's receiptIds array
    await Member.findByIdAndUpdate(memberId, {
      // $push: { receiptIds: receipt._id },  Add the receipt ID to the member's receiptIds array
      $addToSet: { receiptIds: receipt._id }, // Use $addToSet to prevent duplication
    });

    return {
      status: 200,
      data: receipt,
    };
  } catch (error) {
    console.error("Error creating receipt:", error);
    return {
      status: 500,
      error: error.message,
    };
  }
};

const fetchReceipts = async (req, res) => {
  try {
  } catch (err) {}
};

export default { fetchReceipts };
