const User = require('../models/userModel');


const isLogin = async (req, res, next) => {
  try {
    let user;
    if (req.isAuthenticated()) {
      user = req.user;
    } else if (req.session.user) {
      user = await User.findById(req.session.user.id);
    }

    if (user) {
      if (!user.isListed) {
        // User is blocked, destroy session and redirect to login
        req.logout((err) => {
          if (err) {
            console.error('Error logging out:', err);
          }
          req.session.destroy((err) => {
            if (err) {
              console.error('Error destroying session:', err);
            }
            return res.redirect('/login?message=Your account is blocked.');
          });
        });
      } else {
        // User is authenticated and not blocked
        req.session.user = {
          id: user._id,
          email: user.email,
          name: user.name,
          mobile: user.mobile || 'N/A'
        };
        return next();
      }
    } else {
      // User is not authenticated
      return res.redirect('/login');
    }
  } catch (error) {
    console.error('Error in isLogin middleware:', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.isAuthenticated() || req.session.user) {
      return res.redirect('/home');
    }
    return next();
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  isLogin,
  isLogout,
};