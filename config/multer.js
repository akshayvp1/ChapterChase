const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: "./uploads", // Specify your upload directory
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});


const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Set file size limit to 10MB
});

module.exports = upload;
