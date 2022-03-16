const multer = require('multer'); //import multer

const MIME_TYPES = {
  'image/jpg': 'jpg', //import jpg image type
  'image/jpeg': 'jpg', //import jpeg image type
  'image/png': 'png' //import png image type
};

//CREATE A CALLBACK FOR STORE IMAGES
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'images');
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(' ').join('_');
    const extension = MIME_TYPES[file.mimetype];
    callback(null, name + Date.now() + '.' + extension);
  }
});

module.exports = multer({storage: storage}).single('image');