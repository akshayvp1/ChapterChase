const Offer = require('../../models/offerModel');
const Category = require('../../models/categoryModel');
const Product = require('../../models/productModel');


//load add offer
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

//load offer list
const loadOfferlist = async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const offers = await Offer.find({
        offerName: { $regex: search, $options: 'i' }
      })
      .populate('productId', 'productName')
      .populate('categoryId', 'title')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
      const totalOffers = await Offer.countDocuments({
        offerName: { $regex: search, $options: 'i' }
      });
      const totalPages = Math.ceil(totalOffers / limit);
      const products = await Product.find({ status: "Active" });
      const categories = await Category.find({ status: "Active" });
      const admin = req.session.user;
  
      if (admin) {
        res.render('offer-list', { admin, offers, products, categories, currentPage: page, totalPages, limit, search, totalOffers });
      } else {
        res.redirect('/login');
      }
    } catch (error) {
      console.error('Error loading offer list:', error);
      res.status(500).send('Internal Server Error');
    }
  };

//add offer
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

//get offer
const getOffer = async (req, res) => {
    try {
        const offerId = req.params.id;
        const offer = await Offer.findById(offerId)
            .populate('productId', 'productName')
            .populate('categoryId', 'title');

        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        const products = await Product.find({ status: "Active" });
        const categories = await Category.find({ status: "Active" });

        res.json({
            success: true,
            offer,
            products,
            categories
        });
    } catch (error) {
        console.error('Error fetching offer:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }



}

//update offer
const updateOffer = async (req, res) => {
    try {
        const updatedOffer = await Offer.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!updatedOffer) {
            return res.status(404).json({ message: 'Offer not found' });
        }
        res.json({ success: true, offer: updatedOffer });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


module.exports = {
    loadAddOffer,
    loadOfferlist,
    addOffer,
    getOffer,
    updateOffer
   
}