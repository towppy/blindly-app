const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "profile_images",
        allowed_formats: ["jpg", "png", "jpeg"],
    },
});

module.exports = storage;