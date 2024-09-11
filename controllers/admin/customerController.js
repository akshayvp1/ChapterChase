const User = require("../../models/userModel");
const bcrypt = require("bcrypt");
const randomString = require("randomstring");
const config = require("../../config/config");


//load customer list
const loadCustomerList = async (req, res) => {
    try {
        let admin = req.session.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const searchQuery = req.query.search || '';

        const filter = searchQuery 
            ? { 
                $or: [
                    { name: new RegExp(searchQuery, 'i') },
                    { email: new RegExp(searchQuery, 'i') },
                    { mobile: new RegExp(searchQuery, 'i') }
                ]
              } 
            : {};

     
        const customers = await User.find(filter)
            .sort({ otpExpiration: -1 }) 
            .skip((page - 1) * limit)
            .limit(limit);

        const totalCustomers = await User.countDocuments(filter);

        res.render('customer-list', {
            customers,
            admin,
            currentPage: page,
            totalPages: Math.ceil(totalCustomers / limit),
            limit,
            searchQuery 
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).send('Error fetching customers');
    }
};


//edit customer number
const editCustomer = async (req, res) => {
    const { id } = req.params;
    const { name, email, mobile } = req.body;

    try {
        const customer = await User.findByIdAndUpdate(
            id,
            { name, email, mobile },
            { new: true }
        );

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json({ message: 'Customer details updated successfully' });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ message: 'Error updating customer' });
    }
};


//change customer status
const changeCustomerStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const customer = await User.findByIdAndUpdate(
            id,
            { isListed: status === 'true' },
            { new: true }
        );

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json({ message: `Customer has been ${status === 'true' ? 'unblocked' : 'blocked'} successfully` });
    } catch (error) {
        console.error('Error changing customer status:', error);
        res.status(500).json({ message: 'Error changing customer status' });
    }
};



module.exports = {
    loadCustomerList,
    editCustomer,
    changeCustomerStatus
}