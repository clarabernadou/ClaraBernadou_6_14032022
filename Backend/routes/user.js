const express = require('express');
const router = express.Router();

const userCtrl = require('../controllers/user');

//ROUTES USER
router.post('/signup', userCtrl.signup); //for signup
router.post('/login', userCtrl.login); //for login

module.exports = router;