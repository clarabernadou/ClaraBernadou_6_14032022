const User = require('../models/user');

//SECURITY
const bcrypt = require('bcrypt'); //import bcrypt
const jwt = require('jsonwebtoken'); //import jsonwebtoken
const passwordValidator = require('password-validator'); //import password validator

//SIGNUP FUNCTIONALITY
exports.signup = (req, res, next) => {
  bcrypt.hash(req.body.password, 10)
    .then(hash => {
      const user = new User({
        email: req.body.email, //make a query to use the email
        password: hash //hashed password
      });
      user.save() //to save the user
        .then(() => res.status(201).json({ message: 'User created' })) //if user is created
        .catch(error => res.status(400).json({ error })); //else return 400 error
    })
    .catch(error => res.status(500).json({ error })); //else return 500 error
};

//LOGIN FUNCTIONALITY
exports.login = (req, res, next) => {
  User.findOne({ email: req.body.email }) //make a query to find the email
    .then(user => {
      if (!user) {
        return res.status(401).json({ error: 'User not found' }); //if user is not found
      }
      bcrypt.compare(req.body.password, user.password) //compare the entered password and the user's password
        .then(valid => {
          if (!valid) {
            return res.status(401).json({ error: 'incorrect password' }); //if the password is incorrect
          }
          //TOKEN LOGIN
          res.status(200).json({
            userId: user._id,
            token: jwt.sign(
              { userId: user._id },
              'RANDOM_TOKEN_SECRET',
              { expiresIn: '24h' } //session expires after 24 hours
            )
          });
        })
        .catch(error => res.status(500).json({ error })); //else return 500 error
    })
    .catch(error => res.status(500).json({ error })); //else return 500 error
};
