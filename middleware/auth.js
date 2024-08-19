const User = require('../models/userModel');



const isLogin = async (req, res, next) => {
   try {
       if (req.isAuthenticated && req.isAuthenticated()) { 
           return next();
       }
       if (req.session.user) { 
           return next();
       }
       return res.redirect('/login'); 
   } catch (error) {
       console.error('Error in isLogin middleware:', error.message);
       res.status(500).json({ message: 'Internal Server Error' });
   }
};


const isLogout=async(req,res,next)=>{

   try{
    
      if(req.session.user){
      return res.redirect('/home')
      }
     return next();
      
   }catch(error){

      console.log(error.message);

   }
   

}






module.exports={
   isLogin,
   isLogout,
   
}