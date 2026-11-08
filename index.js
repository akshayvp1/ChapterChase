const dns = require("node:dns");

// Force Google DNS (Fixes MongoDB SRV lookup issue)
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
require("dotenv").config();
const path = require("path");
const passport = require("passport");

require("./config/passport");

const app = express();
const port = process.env.PORT || 3000;

// MongoDB Connection
const mongoURI = process.env.MONGO_URI;

mongoose
  .connect(mongoURI, {
    serverSelectionTimeoutMS: 30000,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((error) => {
    console.error("❌ MongoDB Error:");
    console.error(error);
  });

// Static Files
app.use("/assets", express.static(path.join(__dirname, "./assets")));
app.use(
  "/dashboard-assets",
  express.static(path.join(__dirname, "./dashboard-assets"))
);
app.use("/uploads", express.static(path.join(__dirname, "./uploads")));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "chapterchase_secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");

app.use("/admin", adminRoute);
app.use("/", userRoute);

// Start Server
app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});