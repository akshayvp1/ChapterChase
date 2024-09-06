const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session'); 
require('dotenv').config();
const path = require('path');
const passport = require('passport');
require('./config/passport'); 



const app = express();
const port = process.env.PORT;
// MongoDB connection
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error.message);
    });

// Static files
app.use('/assets', express.static(path.join(__dirname, './assets')));
app.use('/dashboard-assets', express.static(path.join(__dirname, 'dashboard-assets')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const userRoute = require('./routes/userRoute');
const adminRoute = require('./routes/adminRoute');

app.use('/admin', adminRoute);
app.use('/', userRoute);


app.use(passport.initialize());
app.use(passport.session());




    


// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack,'this is the error u got there');
    res.status(500).send('Something broke!');
});

 

// Start server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
 