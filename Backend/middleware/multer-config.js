//ADD MULTER
const multer = require('multer');

//ADD THE TYPES FOR IMAGES
const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
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

//EXPORT THE MODULE
module.exports = multer({storage: storage}).single('image');