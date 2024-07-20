
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session'); 
require('dotenv').config();
const passport = require('passport');
require('./config/passport'); 
const fs = require('fs'); 


const app = express();
const port = process.env.PORT;

const userRoute = require('./routes/userRoute');
const adminRoute = require('./routes/adminRoute');

mongoose.connect("mongodb://127.0.0.1:27017/chapterchase")
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error.message);
    });

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

  
app.use('/', userRoute);
app.use('/admin', adminRoute);
app.use('/assets', express.static(path.join(__dirname, "assets")));
app.use('/dashboard-assets',express.static(path.join(__dirname,"dashboard-assets")))
app.use('/uploads', express.static(path.join(__dirname,"uploads")))



const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});
 
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

