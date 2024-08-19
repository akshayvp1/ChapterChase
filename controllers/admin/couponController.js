

const loadAddcoupon = async(req,res)=>{
    
    try {
        let admin = req.session.user
        if(admin){
        res.render('add-coupon',{admin});
        return;
        }
    }
    catch(error){
        console.log(error);
        
    }
}

const loadCouponList = async(req,res)=>{
    try {
        let admin = req.session.user
        if(admin){
        res.render('coupon-list',{admin});
        return;
        }
    }
    catch(error){
        console.log(error);
        
    }
}

module.exports = {
    loadAddcoupon,
    loadCouponList
}