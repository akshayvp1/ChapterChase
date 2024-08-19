const User = require('../models/userModel');



const isLogin = async (req, res, next) => {
   try {
       if (req.isAuthenticated && req.isAuthenticated()) { // If using Passport.js
           return next();
       }
       if (req.session.user) { // If using session-based auth
           return next();
       }
       return res.redirect('/'); // Redirect if not authenticated
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

// const authMiddleware = async (req, res, next) => {
//    try {
//        if (req.session && req.session.user_id) {
//            const user = await User.findById(req.session.user_id);
//            if (user) {
//                res.locals.isAuthenticated = true;
//                res.locals.user = user;
//            } else {
//                res.locals.isAuthenticated = false;
//                res.locals.user = null;
//            }
//        } else {
//            res.locals.isAuthenticated = false;
//            res.locals.user = null;
//        }
//        next();
//    } catch (error) {
//        res.send(error.message);
//    }
// };




module.exports={
   isLogin,
   isLogout,
   
   // checkUserStatus
}