const express = require("express");
const bcrypt = require("bcrypt");
const { auth, authAdmin, authCookies } = require("../middlewares/auth");
const { validateUser, UserModel, validateLogin, createToken, validateUpdateUser } = require("../models/userModel");
const { route } = require("./posts");

const router = express.Router();

router.get("/", async (req, res) => {
  res.json({ msg: "Users endpoint" });
})

router.get("/usersList", authAdmin, async (req, res) => {
  let perPage = req.query.perPage || 5;
  let page = req.query.page - 1 || 0;
  try {
    let data = await UserModel.find({}, { password: 0 })
      .limit(perPage)
      .skip(perPage * page)
    res.status(200).json(data)
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

router.get("/count", authAdmin, async (req, res) => {
  try {
    const count = await UserModel.count();
    res.status(200).json(count);

  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

router.get("/nickNames", async (req, res) => {
  try {
    //The id field is mandatory in ReactSearchAutocomplete. 
    let data = await UserModel.find({}, { _id: 0, id: '$_id', nickname: 1 })
    res.status(200).json(data)
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

router.get("/checkToken", auth, async (req, res) => {
  res.json({ _id: req.tokenData._id, role: req.tokenData.role })
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
//check if cookies work
router.get("/userInfoCookie", authCookies, async (req, res) => {
  try {
    let user = await UserModel.findOne({ _id: req.tokenData._id }, { password: 0 })
    res.status(200).json(user)
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})


router.get("/userInfo/:id", async (req, res) => {
  try {
    let idUser = req.params.id;
    let user = await UserModel.findOne({ _id: idUser }, { password: 0 })
    res.status(200).json(user)
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

router.get("/favorites", auth, async (req, res) => {
  try {
    let user = await UserModel.findOne({ _id: req.tokenData._id })
    res.status(200).json(user.favorites)
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
      return res.status(400).json({ msg: "Email/phone is already in our system", code: 11000 })
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
    let token = createToken(user._id, user.role);
    return res.json({ token })
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})


// cookies

// router.post("/login", async (req, res) => {
//   let validBody = validateLogin(req.body);
//   if (validBody.error) {
//     return res.status(400).json(validBody.error.details);
//   }
//   try {
//     let user = await UserModel.findOne({ email: req.body.email });
//     if (!user) {
//       return res.status(401).json({ err: "Email not found" });
//     }
//     let passwordValid = await bcrypt.compare(req.body.password, user.password);
//     if (!passwordValid) {
//       return res.status(401).json({ err: "Password worng" });
//     }
//     let token = createToken(user._id, user.role);
//     return res.cookie("token", token,{
//         httpOnly:true,
//         expires: new Date(Date.now() + 1000 * 60 * 60 * 24)
//     }).json({ msg:"You logged in" })
//   }
//   catch (err) {
//     console.log(err);
//     res.status(502).json({ err })
//   }
// })

// router.post("/logoutCookie", (req, res) => {
//   res.clearCookie("token").json({ msg: "You have been logged out" });
// });



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

router.patch("/changeRole/:id/:role", authAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const newRole = req.params.role;
    if (id == req.tokenData._id || id == "6482ee4d0c5009a9b1e6048b") {
      res.status(401).json({ msg: "you can't change strong admin or your role" });
    }
    else{
      let user = await UserModel.updateOne({ _id: id }, { role: newRole });
      res.status(201).json(user);
    }
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})
router.patch("/changeUrlMatch/:newUrl",auth, async (req, res) => {
  try {
    const newUrl = req.params.newUrl;
    const id = req.tokenData._id;
    let user = await UserModel.updateOne({ _id: id }, {matchPlacesUrl: newUrl });
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

router.patch("/editFavorite", auth, async (req, res) => {
  try {
    let user = await UserModel.findOne({ _id: req.tokenData._id });
    let favs_ar = user.favorites;
    let index = favs_ar.indexOf(req.body.place_id);
    if (index == -1) {
      let new_favs_ar = [...favs_ar, req.body.place_id];
      let data = await UserModel.updateOne({ _id: user._id }, { favorites: new_favs_ar });
      return res.status(200).json(data);
    }
    favs_ar.splice(index, 1);
    let data = await UserModel.updateOne({ _id: user._id }, { favorites: favs_ar });
    return res.status(200).json(data);
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
    let data = await UserModel.deleteOne({ _id: req.tokenData._id });
    res.status(201).json(data);
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})

router.delete("/delete/:id", auth, async (req, res) => {
  try {
    const id = req.params.id;
    let data = await UserModel.deleteOne({ _id: id });
    res.status(201).json(data);
  }
  catch (err) {
    console.log(err);
    res.status(502).json({ err })
  }
})


module.exports = router;