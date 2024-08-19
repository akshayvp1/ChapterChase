
const User = require('../../models/userModel');
const bcrypt = require('bcrypt');
require('dotenv').config();




  //Load change password
  const loadChangePassword = async(req,res)=>{
    try{
        res.render('change-password')
    }
    catch(error){
        console.log(error.message);    
    }
  }


  //load password change
  const loadPasswordChange = async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.session.user.id; 

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New passwords do not match' });
    }
    if (!oldPassword) {
      return res.status(400).json({ success: false, message: 'Old password is required' });
    }
  
    try {
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      console.log('Stored Password Hash:', user.password);
      const isMatch = await bcrypt.compare(oldPassword, user.password);
  
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Old password is incorrect' });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();
  
      res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      console.error('Error changing password:', error); 
      res.status(500).json({ success: false, message: 'Error changing password', error: error.message });
    }
  };


  module.exports = {
    loadChangePassword,
    loadPasswordChange

  }