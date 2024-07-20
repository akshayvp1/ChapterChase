

const isLogin=async(req,res,next)=>{

    try{
      

       if(req.session.user || req.isAuthenticated){
        next();
       }
       else{
         
          return res.redirect('/')
       
       }
      
       
    }catch(error){

       console.log(error.message);

    }

}
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
   isLogout
}