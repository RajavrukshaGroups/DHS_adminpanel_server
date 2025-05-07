import express from 'express';
import MemberController from '../../controller/memberController/memberController.js';

import upload from '../../middleware/multer.js';

const router = express.Router();

router.post('/add-member', MemberController.addMemberDetails);

export default router;
