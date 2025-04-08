const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'inventory-app', // Cloudinary folder
    allowed_formats: ['jpg', 'jpeg', 'png'], // Allowed formats
  },
});

// Set up multer with Cloudinary storage
const upload = multer({ storage });

module.exports = { upload, cloudinary };