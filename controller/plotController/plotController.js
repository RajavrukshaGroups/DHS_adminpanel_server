import Member from "../../model/memberModel.js"; // adjust path as needed


 const getAllSeniorityIDs = async (req, res) => {
  try {
    console.log('funciton is called');
    
    const seniorityIds = await Member.find({}, { SeniorityID: 1, _id: 0 });
    res.status(200).json(seniorityIds);
  } catch (error) {
    res.status(500).json({ message: "Error fetching Seniority IDs" });
  }
};

 const getMemberBySeniorityID = async (req, res) => {
  try {

    console.log(req.params.id,'paramssssssssssssssssssssssssssssssss');
    const  seniorityId  = req.params.id;
    const member = await Member.findOne({ SeniorityID: seniorityId });
    console.log(member,'membererrrrrrrrrrrrrrrr')
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.status(200).json(member);
  } catch (error) {
    res.status(500).json({ message: "Error fetching member details" });
  }
};

export default {
    getAllSeniorityIDs,
    getMemberBySeniorityID
}