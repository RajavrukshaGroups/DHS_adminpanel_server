import express from 'express';
import MemberController from '../../controller/memberController/memberController.js';
import formidable from 'express-formidable';
import upload from '../../middleware/multer.js';

const router = express.Router();

// router.post('/add-member', MemberController.addMemberDetails);
router.post('/add-member', formidable({ multiples: true }), MemberController.addMemberDetails);

router.get('/view-member-details', MemberController.getMemberDetails);
export default router;
