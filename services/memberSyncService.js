// services/memberSyncService.js

import Member from "../model/memberModel.js";
import Receipt from "../model/receiptModel.js";
import { generateUniquePassword } from "../utils/generatePassword.js";
import { createReceipt } from "../controller/receiptController/receiptController.js";

export const createOrUpdateMember = async (mappedData) => {
  try {
    let member = await Member.findOne({
      MembershipNo: mappedData.MembershipNo,
    });

    if (!member) {
      const password = await generateUniquePassword();

      member = await Member.create({
        ...mappedData,
        password,
      });

      // create membership fee receipt
      await createReceipt(member._id, mappedData.membershipReceipt);

      return {
        action: "created",
        member,
      };
    }

    // Update existing member

    await Member.findByIdAndUpdate(
      member._id,
      mappedData,
      {
        new: true,
      }
    );

    return {
      action: "updated",
      member,
    };
  } catch (err) {
    throw err;
  }
};