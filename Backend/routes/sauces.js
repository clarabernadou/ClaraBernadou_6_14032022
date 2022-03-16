const express = require('express'); //import express
const multer = require('../middleware/multer-config') //import multer

const router = express.Router();

const auth = require('../middleware/auth');
const sauceCtrl = require('../controllers/sauce');

//ROUTES SAUCES
router.get('/', auth, multer, sauceCtrl.getAllSauces); //get all sauces
router.post('/', auth, multer, sauceCtrl.createSauce); //create the sauce
router.get('/:id', auth, multer, sauceCtrl.getOneSauce); //get one sauce
router.put('/:id', auth, multer, sauceCtrl.modifySauce); //modify the sauce
router.delete('/:id', auth, sauceCtrl.deleteSauce); //deleted the sauce
router.post('/:id/like', auth, sauceCtrl.likeOrNot); //for like or dislike the sauce

module.exports = router;