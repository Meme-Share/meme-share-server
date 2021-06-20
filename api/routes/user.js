const express = require("express");
const router = express.Router();

const checkAuth = require("../middleware/check-auth.js");

const {
  getUsers,
  getUser,
  signUp,
  signIn,
  followUser,
  unFollowUser,
  userVerification,
  updateUser,
  deleteUser,
} = require("../controllers/user");

router.get("/", checkAuth, getUsers);
router.get("/:user", checkAuth, getUser);

router.post("/signup", signUp);
router.post("/signin", signIn);

router.patch("/follow/:id", checkAuth, followUser);
router.patch("/unfollow/:id", checkAuth, unFollowUser);

router.get("/verify/:token", userVerification);

router.patch("/:userId", checkAuth, updateUser);
router.delete("/:userId", checkAuth, deleteUser);

module.exports = router;
