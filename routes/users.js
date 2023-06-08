const express = require("express");
const bcrypt = require("bcrypt");
const { auth, authAdmin } = require("../middlewares/auth");
const { validateUser, UserModel, validateLogin, createToken, validateUpdateUser } = require("../models/userModel");
const { route } = require("./posts");

const router = express.Router();

router.get("/", async (req, res) => {
  res.json({ msg: "Users endpoint" });
})

//add authAdmin!!
router.get("/usersList", async (req, res) => {
  try {
    let data = await UserModel.find({}, { password: 0 })
    res.status(200).json(data)
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

router.get("/userInfo", auth, async (req, res) => {
  try {
    let user = await UserModel.findOne({ _id: req.tokenData._id }, { password: 0 })
    res.status(200).json(user)
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})


router.post("/", async (req, res) => {
  let validBody = validateUser(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    let user = new UserModel(req.body);
    user.password = await bcrypt.hash(user.password, 10);
    await user.save();
    user.password = "******"
    res.status(201).json(user);
  }
  catch (err) {
    if (err.code == 11000) {
      return res.status(400).json({ msg: "Email already in system", code: 11000 })
    }
    console.log(err);
    res.status(502).json({ err })
  }
})

router.post("/login", async (req, res) => {
  let validBody = validateLogin(req.body);
  if (validBody.error) {
    return res.status(400).json(validBody.error.details);
  }
  try {
    let user = await UserModel.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).json({ err: "Email not found" });
    }
    let passwordValid = await bcrypt.compare(req.body.password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ err: "Password worng" });
    }
    let token = createToken(user._id)
    return res.json({ token })
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})


router.put("/updateUser", auth, async (req, res) => {
  try {
    let validBody = validateUpdateUser(req.body);
    if (validBody.error) {
      return res.status(400).json(validBody.error.details);
    }
    let user = await UserModel.updateOne({ _id: req.tokenData._id }, req.body);
    res.status(201).json(user);
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

router.patch("/changePassword", auth, async (req, res) => {
  try {
    let user = await UserModel.findOne({ _id: req.tokenData._id });
    let passwordValid = await bcrypt.compare(req.body.oldPassword, user.password);
    if (!passwordValid) {
      return res.status(401).json({ err: "Password worng, can't delete account" });
    }
    let password = await bcrypt.hash(req.body.newPassword, 10);
    let data = await UserModel.updateOne({ _id: req.tokenData._id }, { password })
    user.password = "******"
    res.status(201).json(data);
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

router.patch("/addFavorite", auth, async (req, res) => {
  try {
    let user = await UserModel.findOne({ _id: req.tokenData._id });
    let favs_ar = user.favorites;
    let new_favs_ar = [...favs_ar, req.body.favorite];
    let data = await UserModel.updateOne({ _id: user._id }, { favorites: new_favs_ar });
    res.status(200).json(data);
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

router.delete("/deleteAccount", auth, async (req, res) => {
  try {
    let passwordValid = await bcrypt.compare(req.body.password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ err: "Password worng, can't delete account" });
    }
    let data = await UserModel.delteOne({ _id: req.tokenData._id });
    res.status(201).json(data);
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})


module.exports = router;