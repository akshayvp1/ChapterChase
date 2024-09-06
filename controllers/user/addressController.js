

const Address = require('../../models/addressModel');
const Cart = require('../../models/cartModel');
const Product = require('../../models/productModel');
const Wishlist = require('../../models/wishlistModel');




//load user address
const loadUserAddress = async (req, res) => {
  try {

      const userId = req.session.user.id;
      if (!userId) {
          return res.redirect('/login');
      }

      const addresses = await Address.find({ userId: userId });

      let cart = null;
      let cartCount = 0;

      const user = req.session.user;

      if (userId) {
          cart = await Cart.findOne({ userId });
          if (cart && cart.items) {
              cartCount = cart.items.length;
          }
      }
       let wishlist=null;
        let wishlistCount=0;

        if(user&& user.id){
            wishlist=await Wishlist.findOne({userId: user.id})
            if(wishlist && wishlist.products){
                wishlistCount=wishlist.products.length
                
            }
        }

      res.render('address-user', { 
          user: req.session.user, 
          addresses: addresses, 
          cartCount: cartCount ,
          wishlistCount
      });
  } catch (error) {
      console.error('Error loading user address:', error.message);
      res.status(500).send('Error loading user address');
  }
};


//get address
const getAddress = async (req, res) => {
    try {
      const addressId = req.params.id;
      const address = await Address.findById(addressId);
  
      if (!address) {
        return res.status(404).json({ message: 'Address not found' });
      }
  
      res.status(200).json(address);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching address', error });
    }
  };

//add address
const addAddress = async (req, res) => {
  try {
      console.log('User session:', req.session);
      
      const userId = req.session.user?.id;
      console.log('User ID from session:', userId);

      if (!userId) {
          return res.status(401).json({ error: 'User not authenticated. Please log in again.' });
      }
      const { addressName, addressEmail, addressMobile, addressHouse, addressStreet, addressPost, addressCity, addressDistrict, addressState, addressPin } = req.body;

      const pin = parseInt(addressPin, 10);

      if (isNaN(pin) || pin < 100000 || pin > 999999) {
          return res.status(400).json({ error: `Invalid pin code: "${addressPin}". Please enter a 6-digit number.` });
      }

      const newAddress = new Address({
          userId,
          addressName,
          addressEmail,
          addressMobile,
          addressHouse,
          addressStreet,
          addressPost,
          addressCity,
          addressDistrict,
          addressState,
          addressPin: pin
      });

      const savedAddress = await newAddress.save();
      
      res.status(200).json({ success: true, address:  savedAddress });
  } catch (error) {
      console.error('Error saving address:', error);
      res.status(500).json({ error: 'Error saving address. Please try again.' });
  }
};

  //update address
  const updateAddress = async (req, res) => {
    try {
      const addressId = req.params.id;
      const updatedData = req.body;
  
     
      const address = await Address.findByIdAndUpdate(addressId, updatedData, { new: true });
  
      if (!address) {
        console.log('Address not found:', addressId);
        return res.status(404).json({ message: 'Address not found' });
      }
  
      res.status(200).json(address);
    } catch (error) {
      console.error('Error updating address:', error);
      res.status(500).json({ message: 'Error updating address', error: error.message });
    }
  };

  //delete Address
  const deleteAddres = async (req, res) => {
    try {
      const addressId = req.params.id;
      const address = await Address.findByIdAndDelete(addressId);
  
      if (!address) {
        return res.status(404).json({ success: false, message: 'Address not found' });
      }
  
      res.status(200).json({ success: true, message: 'Address deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error deleting address', error });
    }
  };
  
 




  module.exports = {
    loadUserAddress,
    getAddress,
    updateAddress,
    deleteAddres,
    addAddress
  }