const Coupon = require('../../models/couponModel');

//load addcoupon
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

//Add Coupon
const addCoupon = async (req, res) => {
    try {
        const { couponCode, description, redeemAmount, minAmount, expiryDate, publishStatus } = req.body;

        const isListed = publishStatus === 'Active'; 


        const newCoupon = new Coupon({
            couponCode,
            description,
            redeemAmount: parseFloat(redeemAmount),
            minAmount: parseFloat(minAmount),
            expiryDate: new Date(expiryDate),
            isListed: isListed
        });

        await newCoupon.save();

        res.status(200).json({ success: true, message: 'Coupon added successfully!' });
    } catch (error) {
        console.error('Error adding coupon:', error);
        res.status(500).json({ success: false, message: 'Error adding coupon: ' + error.message });
    }
};

//load Coupon list
const loadCouponList = async (req, res) => {
    try {
        const { page = 1, limit = 3, search = '' } = req.query;
        
        const coupons = await Coupon.find({
            couponCode: { $regex: search, $options: 'i' }
        })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ addedDateTime: -1 }); 

        const totalCoupons = await Coupon.countDocuments({
            couponCode: { $regex: search, $options: 'i' }
        });

        const totalPages = Math.ceil(totalCoupons / limit);
        const admin = req.session.user;

        res.render('coupon-list', {
            admin, 
            coupons, 
            totalCoupons, 
            currentPage: parseInt(page), 
            totalPages, 
            limit: parseInt(limit), 
            search 
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred while loading coupons");
    }
};


//get coupon
const getCoupon = async (req, res) => {
    try {
        const couponId = req.params.id;
        const coupon = await Coupon.findById(couponId);
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        res.json(coupon);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'An error occurred while fetching the coupon' });
    }
};

//update coupon
const updateCoupon = async (req, res) => {
    try {
        const couponId = req.params.id;
        const updatedData = req.body;
        const coupon = await Coupon.findByIdAndUpdate(couponId, updatedData, { new: true });
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }
        res.json({ success: true, message: 'Coupon updated successfully', coupon });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'An error occurred while updating the coupon' });
    }
};

module.exports = {
    loadAddcoupon,
    addCoupon,
    loadCouponList,
    updateCoupon,
    getCoupon
}