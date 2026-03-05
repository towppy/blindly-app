const multer = require("multer");
const storage = require("./cloudinaryStorage");

const upload = multer({ storage });

module.exports = upload;