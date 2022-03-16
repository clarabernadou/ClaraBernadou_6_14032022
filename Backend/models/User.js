const mongoose = require('mongoose'); //import mongoose
const uniqueValidator = require('mongoose-unique-validator'); //import mongoose unique validator

//SCHEMA USER
const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);