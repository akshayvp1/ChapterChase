const User = require("../../models/userModel");
const bcrypt = require("bcrypt");
const randomString = require("randomstring");
const config = require("../../config/config");


//Load dashboard
const loadDashboard = (req, res) => {
    try {
        let admin = req.session.user
        if(admin){
        res.render('dashboard',{admin});
        return;
        }
    } catch (error) {
        console.log(error.message);
    }
}
module.exports = {
    loadDashboard
}