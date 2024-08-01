const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: "./assets/uploads", // Specify your upload directory
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});


const upload = multer({
  storage: storage,
  limits: { fileSize:  1024 * 1024 * 5 },// 5MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb("Error: Images Only!");
    }
  },
})





module.exports = upload;

