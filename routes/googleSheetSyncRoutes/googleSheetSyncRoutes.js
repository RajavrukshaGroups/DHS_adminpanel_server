import express from "express";
const router = express.Router();
import GoogleSheetSyncController from "../../controller/googleSheetSyncController/googleSheetSyncController.js";
import GoogleSheetMarasandraSyncController from "../../controller/googleSheetSyncController/googleSheetSyncMarasandra.js";
import GoogleSheetTapasihalliSiteAdvanceController from "../../controller/googleSheetSyncController/siteAdvTapasihalliGoogleSheet.js";
import GoogleSheetMarasandraSiteAdvanceController from "../../controller/googleSheetSyncController/siteAdvMarasandraGoogleSheet.js";

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
router.post(
  "/google-sheet-sync-siteadvance-tapasihalli",
  GoogleSheetTapasihalliSiteAdvanceController.SyncSiteAdvanceFromTapasihalliSheet,
);
router.post(
  "/google-sheet-update-siteadvance-tapasihalli",
  GoogleSheetTapasihalliSiteAdvanceController.UpdateSiteAdvanceFromTapasihalliSheet,
);
router.post(
  "/google-sheet-sync-siteadvance-marasandra",
  GoogleSheetMarasandraSiteAdvanceController.SyncSiteAdvanceFromMarasandraSheet,
);
router.post(
  "/google-sheet-update-siteadvance-marasandra",
  GoogleSheetMarasandraSiteAdvanceController.UpdateSiteAdvanceFromMarasandraSheet,
);

export default router;
