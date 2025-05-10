import express from 'express';
import MemberController from '../../controller/memberController/memberController.js';
import formidable from 'express-formidable';
import upload from '../../middleware/multer.js';
import memberController from '../../controller/memberController/memberController.js';
import Member from '../../model/memberModel.js'; // adjust path as needed
const router = express.Router();

// router.post('/add-member', MemberController.addMemberDetails);
router.post('/add-member', formidable({ multiples: true }), MemberController.addMemberDetails);
router.get('/view-member-details', MemberController.getMemberDetails);
// router.get('/check-duplicates/:id',memberController.check_duplicates);
router.get('/check-duplicates',memberController.checkDuplicates);

// PUT: /member/update-status/:id
router.put('/update-status/:id', async (req, res) => {
    try {
      const member = await Member.findByIdAndUpdate(req.params.id, {
        isActive: req.body.isActive
      }, { new: true });
  
      res.status(200).json(member);
    } catch (error) {
      res.status(500).json({ error: "Failed to update status" });
    }
  });
  

export default router;

