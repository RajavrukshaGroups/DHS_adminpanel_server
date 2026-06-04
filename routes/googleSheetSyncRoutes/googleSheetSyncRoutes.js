import express from "express";
const router = express.Router();
import GoogleSheetSyncController from "../../controller/googleSheetSyncController/googleSheetSyncController.js";
import GoogleSheetMarasandraSyncController from "../../controller/googleSheetSyncController/googleSheetSyncMarasandra.js";

router.post(
  "/google-sheet-sync-member",
  GoogleSheetSyncController.SyncSingleMemberFromSheet,
);
router.post(
  "/google-sheet-update-member",
  GoogleSheetSyncController.UpdateMemberFromSheet,
);
router.post(
  "/google-sheet-sync-marasandra-member",
  GoogleSheetMarasandraSyncController.SyncSingleMemberFromMarasandraSheet,
);
router.post(
  "/google-sheet-update-marasandra-member",
  GoogleSheetMarasandraSyncController.UpdateMemberFromMarasandraSheet,
);

export default router;
