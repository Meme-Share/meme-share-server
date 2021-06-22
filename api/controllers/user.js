const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const mailer = require("../utils/mailer");

exports.getUsers = (req, res, next) => {
  User.find()
    .select("_id username email role bio verified picture followers following")
    .populate({ path: "followers", select: "username picture" })
    .populate({ path: "following", select: "username picture" })
    .exec()
    .then((docs) => res.status(200).json(docs))
    .catch((err) => res.status(500).json({ error: err }));
};

exports.getUser = (req, res, next) => {
  var user = req.params.user;

  User.find({ username: user })
    .select("_id username email role bio verified picture")
    .exec()
    .then((doc) => {
      res.status(200).json(doc[0]);
    })
    .catch((err) => res.status(500).json({ err }));
};

exports.signUp = (req, res, next) => {
  User.find({ email: req.body.email })
    .exec()
    .then((user) => {
      if (user.length >= 1) {
        return res.status(409).json({
          message: "Mail exists",
        });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            return res.status(500).json({
              error: err,
            });
          } else {
            const token = jwt.sign(
              { email: req.body.email },
              process.env.PRIVATE_KEY
            );
            const user = new User({
              _id: new mongoose.Types.ObjectId(),
              username: req.body.username,
              email: req.body.email,
              password: hash,
              role: "member",
              bio: "",
              verified: false,
              confirmationCode: token,
            });
            mailer
              .sendEmail(
                process.env.AUTH_USER,
                req.body.email,
                "MemeShare: Email verification",
                `Press <a href=https://memeshare-server01.herokuapp.com/user/verify/${token}> here </a> to verify your account.`
              )
              .then(() => {
                user
                  .save()
                  .then(() => {
                    res.status(201).json({
                      message: "User created",
                    });
                  })
                  .catch((err) => {
                    res.status(500).json({
                      error: err,
                    });
                  });
              })
              .catch((err) => {
                res.status(500).json({ err });
              });
          }
        });
      }
    });
};

exports.signIn = (req, res, next) => {
  User.find({ username: req.body.username })
    .exec()
    .then((user) => {
      if (user.length < 1) {
        return res.status(401).json({
          message: "Auth failed",
        });
      } else if (user[0].verified === false) {
        return res.status(500).json({
          message: "Account is not verified!",
        });
      }
      bcrypt.compare(req.body.password, user[0].password, (err, result) => {
        if (err) {
          return res.status(401).json({
            message: "Auth failed",
          });
        }
        if (result) {
          const token = jwt.sign(
            {
              userId: user[0]._id,
              username: user[0].username,
              role: user[0].role,
            },
            process.env.PRIVATE_KEY,
            {
              expiresIn: "1h",
            }
          );
          return res.status(200).json({
            message: "Auth successful",
            token: token,
          });
        }
        res.status(401).json({
          message: "Auth failed",
        });
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
};

exports.followUser = async (req, res, next) => {
  const followerId = req.body.followerId;
  const followingId = req.body.followingId;

  User.findByIdAndUpdate(followerId, {
    $push: { followers: followingId },
  })
    .exec()
    .then(() => {
      User.findByIdAndUpdate(followingId, {
        $push: { following: followerId },
      })
        .exec()
        .then(() => res.status(200).json({ message: "Followed successfully!" }))
        .catch((err) => res.status(500).json({ error: err }));
    })
    .catch((err) => res.status(500).json({ error: err }));
};

exports.unFollowUser = async (req, res, next) => {
  const followerId = req.body.followerId;
  const followingId = req.body.followingId;

  User.findByIdAndUpdate(followerId, {
    $pull: { followers: followingId },
  })
    .exec()
    .then(() => {
      User.findByIdAndUpdate(followingId, {
        $pull: { following: followerId },
      })
        .exec()
        .then(() =>
          res.status(200).json({ message: "Unfollowed successfully!" })
        )
        .catch((err) => res.status(500).json({ error: err }));
    })
    .catch((err) => res.status(500).json({ error: err }));
};

exports.userVerification = (req, res, next) => {
  User.update(
    { confirmationCode: req.params.token },
    { $set: { verified: true } }
  )
    .exec()
    .then(() => res.redirect("https://meme-share.netlify.app/"))
    .catch((err) => res.status(500).json({ error: err }));
};

exports.updateUser = (req, res, next) => {
  var userId = req.params.userId;

  const updateOps = {};
  for (const ops of req.body) {
    updateOps[ops.propName] = ops.value;
  }
  User.update({ _id: userId }, { $set: updateOps })
    .exec()
    .then(() => {
      User.findById(userId)
        .exec()
        .then((user) => {
          const token = jwt.sign(
            {
              userId: user._id,
              username: user.username,
              role: user.role,
            },
            process.env.PRIVATE_KEY,
            {
              expiresIn: "1h",
            }
          );
          res.status(200).json({
            message: "User updated",
            token: token,
          });
        })
        .catch((err) => res.status(500).json({ error: err }));
    })
    .catch((err) => res.status(500).json({ error: err }));
};

exports.deleteUser = (req, res, next) => {
  User.remove({ _id: req.params.userId })
    .exec()
    .then((result) => res.status(200).json({ message: "User deleted" }))
    .catch((err) => res.status(500).json({ error: err }));
};
