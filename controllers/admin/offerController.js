const Offer = require('../../models/offerModel');
const Category = require('../../models/categoryModel');
const Product = require('../../models/productModel');



const loadAddOffer = async(req,res)=>{
    try {
        const products = await Product.find({status:"Active"})
        const categories = await Category.find({status:"Active"});
        let admin = req.session.user
        if(admin){
        res.render('add-offer',{admin,categories,products});
        return;
        }
    }
    catch(error){
        console.log(error);
        
    }
}
const loadOfferlist = async (req, res) => {
    try {
        const products = await Product.find({ status: "Active" });
        const categories = await Category.find({ status: "Active" });

        const offers = await Offer.find({})
            .populate('productId', 'productName')  
            .populate('categoryId', 'title');  
        
        const admin = req.session.user;

        if (admin) {
            res.render('offer-list', { admin, offers, products, categories });
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error loading offer list:', error);
        res.status(500).send('Internal Server Error');
    }
};


const addOffer = async (req, res) => {
    try {
        const { offerType, offerName, discount, status, categoryId, productId } = req.body;

        if (!offerName || !discount || !offerType || !status) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const newOffer = new Offer({
            offerType,
            offerName,
            discount: Number(discount),
            status,
        });

        if (offerType === 'product' && productId) {
            newOffer.productId = productId;
        } else if (offerType === 'category' && categoryId) {
            newOffer.categoryId = categoryId;
        } else {
            return res.status(400).json({ success: false, message: 'Invalid offer type or missing product/category' });
        }

        await newOffer.save();

        res.redirect('/admin/add-offer')
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error adding offer', error: error.message });
    }
};



module.exports = {
    loadAddOffer,
    loadOfferlist,
    addOffer,
   
}