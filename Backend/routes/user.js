const express = require('express');
const router = express.Router();

const userCtrl = require('../controllers/user');
const userPassLength = require('../middleware/password');

//ROUTES USER
router.post('/signup', userPassLength, userCtrl.signup); //for signup
router.post('/login', userCtrl.login); //for login

module.exports = router;