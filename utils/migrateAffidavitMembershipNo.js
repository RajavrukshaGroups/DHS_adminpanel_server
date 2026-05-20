import mongoose from "mongoose";
import dotenv from "dotenv";

import Member from "../model/memberModel.js";
import MemberAffidavit from "../model/memberAffidavit.js";

dotenv.config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    console.log("MongoDB connected");

    const affidavits = await MemberAffidavit.find({
      $or: [
        { MembershipNo: { $exists: false } },
        { MembershipNo: null },
        { MembershipNo: "" },
      ],
    });

    console.log(`Found ${affidavits.length} affidavits to migrate`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const affidavit of affidavits) {
      try {
        // old linkage
        const member = await Member.findById(affidavit.userId);

        if (!member) {
          console.log(`Skipping affidavit ${affidavit._id} - member not found`);

          skippedCount++;
          continue;
        }

        if (!member.MembershipNo) {
          console.log(
            `Skipping affidavit ${affidavit._id} - MembershipNo missing`,
          );

          skippedCount++;
          continue;
        }

        affidavit.MembershipNo = member.MembershipNo;

        // optional refresh
        affidavit.userId = member._id;

        await affidavit.save();

        updatedCount++;

        console.log(
          `Updated affidavit ${affidavit._id} -> ${member.MembershipNo}`,
        );
      } catch (err) {
        console.error(
          `Error processing affidavit ${affidavit._id}`,
          err.message,
        );
      }
    }

    console.log("\n========== MIGRATION COMPLETE ==========");
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);

    process.exit(1);
  }
};

migrate();
