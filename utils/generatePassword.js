import Member from '../model/memberModel.js'; // adjust path to your model

export const generateUniquePassword = async (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    let isUnique = false;
    let password = '';
  
    while (!isUnique) {
      password = '';
      for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
  
      const existingUser = await Member.findOne({ password });
      if (!existingUser) {
        isUnique = true;
      }
    }
  
    return password;
  };
  
//   module.exports = generateRandomPassword;
  