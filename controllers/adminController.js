const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const randomString = require("randomstring");
const config = require("../config/config");

//Load admin login page
const loadAdminLogin = (req, res) => {
    try {
        console.log("Loading Admin Login Page");
        res.render('adminlogin');
    } catch (error) {
        console.log(error.message);
    }
}


//Verify email and password then directly entered to dashboard
const verifyAdmin = async (req, res) => {
    try {
        
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email });
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                if (userData.is_admin) {
                    
                    console.log("dashboard");
                    req.session.user = userData;
                    return res.redirect("/admin/dashboard");
                } else {
                    console.log("incorrect");
                    return res.render("adminlogin", { message: "Email or password is incorrect" });
                }
            } else {
                return res.render("adminlogin", { message: "Email or password is incorrect" });
            }
        } else {
            return res.render("adminlogin", { message: "Email or password is incorrect" });
        }
    } catch (error) {
        console.log(error.message);
    }
}


//Load dashboard
const loadDashboard = (req, res) => {
    try {
        let admin = req.session.user
        res.render('dashboard',{admin});
    } catch (error) {
        console.log(error.message);
    }
}

const loadCustomerList = async (req, res) => {
    try {
        let admin = req.session.user
      const customers = await User.find(); 
      res.render('customer-list', { customers,admin });
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).send('Error fetching customers');
    }
  };
  
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
const adminLogout = (req, res) => {
    try {
        req.session.destroy(err => {
            if (err) {
                console.error('Error destroying session:', err.message);
            } else {
                console.log('Session destroyed successfully');
            }
            res.render('adminlogin'); // Redirect to login page after logout
        });
    } catch (error) {
        console.error('Error logging out:', error.message);
        res.status(500).send('Internal server error');
    }
};


module.exports = {
    loadAdminLogin,
    verifyAdmin,
    loadDashboard ,
    loadCustomerList,
    changeCustomerStatus,
    editCustomer,
    adminLogout
   

    
}
