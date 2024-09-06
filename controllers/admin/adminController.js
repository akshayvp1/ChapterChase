const User = require("../../models/userModel");
const bcrypt = require("bcrypt");
const randomString = require("randomstring");
const config = require("../../config/config");

//Load admin login page
const loadAdminLogin = (req, res) => {
    try {
       
        res.render('adminlogin');
    } catch (error) {
        console.log(error.message);
    }
}


//Verify email and password 
const verifyAdmin = async (req, res) => {
    try {
        
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email });
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                if (userData.is_admin) {
                    
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


//admin logout
const adminLogout = (req, res) => {
    try {
        req.session.destroy(err => {
            if (err) {
                console.error('Error destroying session:', err.message);
            } else {
                console.log('Session destroyed successfully');
            }
            res.render('adminlogin'); 
        });
    } catch (error) {
        console.error('Error logging out:', error.message);
        res.status(500).send('Internal server error');
    }
};


module.exports = {
    loadAdminLogin,
    verifyAdmin,
    adminLogout
   

    
}
