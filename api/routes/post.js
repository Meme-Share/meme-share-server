const express = require("express");
const router = express.Router();

const checkAuth = require("../middleware/check-auth.js");

const {
  getPosts,
  getPost,
  addPost,
  editPost,
  deletePost,
} = require("../controllers/post");

router.get("/", checkAuth, getPosts);
router.get("/:postId", checkAuth, getPost);

router.post("/", checkAuth, addPost);

router.patch("/:postId", checkAuth, editPost);

router.delete("/:userId/:postId", checkAuth, deletePost);

module.exports = router;
