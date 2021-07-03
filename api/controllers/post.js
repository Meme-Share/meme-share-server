const mongoose = require("mongoose");

const User = require("../models/user");
const Post = require("../models/post");

exports.getPosts = (req, res) => {
  Post.find()
    .select("_id title date author image")
    .populate({ path: "author", select: "username picture" })
    .exec()
    .then((docs) => res.status(200).json(docs))
    .catch((err) => res.status(500).json({ error: err }));
};

exports.getPost = (req, res) => {
  Post.findById(req.params.postId)
    .select("_id title date author image")
    .populate({ path: "author", select: "username picture" })
    .exec()
    .then((doc) => res.status(200).json(doc))
    .catch((err) => res.status(500).json({ err }));
};

exports.addPost = (req, res) => {
  const post = new Post({
    _id: new mongoose.Types.ObjectId(),
    title: req.body.title,
    author: req.body.authorId,
    image: req.body.image,
  });
  post
    .save()
    .then((result) => {
      User.findByIdAndUpdate(req.body.authorId, {
        $push: { posts: result.id },
      })
        .then(() => {
          res.status(200).json({
            message: "Created the post successfully",
            postId: result.id,
          });
        })
        .catch((err) => res.status(404).json({ error: err }));
    })
    .catch((err) => res.status(500).json({ error: err }));
};

exports.deletePost = (req, res) => {
  Post.remove({ _id: req.params.postId })
    .exec()
    .then(() => {
      User.findByIdAndUpdate(req.params.userId, {
        $pull: { posts: req.params.postId },
      })
        .then(() => res.status(200).json({ message: "Post deleted" }))
        .catch((err) => res.status(404).json({ error: err }));
    })
    .catch((err) => res.status(500).json({ error: err }));
};
