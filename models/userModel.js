const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const { config } = require("../config/secret")

let schema = new mongoose.Schema({
  full_name: String,
  img_url: String,
  phone: String,
  email: String,
  password: String,
  location: String,
  nickname: String,
  matchPlacesUrl: String,
  date_created: {
    type: Date, default: Date.now
  },
  role: {
    type: String, default: "user"
  },
  favorites: Array
})
exports.UserModel = mongoose.model("users", schema)

exports.createToken = (user_id, _role) => {
  let token = jwt.sign({ _id: user_id, role: _role }, config.tokenSecret, { expiresIn: "600mins" });
  return token;
}

exports.validateUser = (_reqBody) => {
  let joiSchema = Joi.object({
    full_name: Joi.string().min(2).max(150).required(),
    img_url: Joi.string().min(2).max(400).allow(null, ""),
    matchPlacesUrl: Joi.string().min(2).max(500).allow(null, ""),
    phone: Joi.string().min(1).max(25).required(),
    email: Joi.string().min(2).max(400).email().required(),
    password: Joi.string().min(2).max(400).required(),
    location: Joi.string().min(2).max(400).required(),
    nickname: Joi.string().min(2).max(100).required(),
  })
  return joiSchema.validate(_reqBody)
}
exports.validateUpdateUser = (_reqBody) => {
  let joiSchema = Joi.object({
    full_name: Joi.string().min(2).max(150).required(),
    img_url: Joi.string().min(2).max(400).allow(null, ""),
    phone: Joi.string().min(1).max(25).required(),
    email: Joi.string().min(2).max(400).email().required(),
    location: Joi.string().min(2).max(400).required(),
    nickname: Joi.string().min(2).max(100).required(),
    matchPlacesUrl: Joi.string().min(2).max(500).allow(null, ""),
  })
  return joiSchema.validate(_reqBody)
}
exports.validateLogin = (_reqBody) => {
  let joiSchema = Joi.object({
    email: Joi.string().min(1).max(300).email().required(),
    password: Joi.string().min(1).max(100).required(),
  })
  return joiSchema.validate(_reqBody)
}

