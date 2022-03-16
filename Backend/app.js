const express = require('express'); //import express
const bodyParser = require('body-parser'); //import body parser
const mongoose = require('mongoose'); //import mongoose
const path = require('path'); //import path

//FOR SECURITY
const helmet = require('helmet'); //import helmet
require('dotenv').config() //import dotenv

//ROUTES
const saucesRoutes = require('./routes/sauces')
const userRoutes = require('./routes/user');

mongoose.connect(process.env.A_A, //secure mongoDB link via dotenv
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connection to MongoDB successful')) //if Connection to MongoDB successful
  .catch(() => console.log('Connection to MongoDB failed')); //else Connection to MongoDB failed

const app = express();

//FOR CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.use(bodyParser.json());

app.use('/images', express.static(path.join(__dirname, 'images'))); //for images
app.use('/api/sauces', saucesRoutes);
app.use('/api/auth', userRoutes);

module.exports = app;