const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const mailer = require("../utils/mailer");

exports.getUsers = (req, res, next) => {
  User.find()
    .select("_id username email role bio verified picture")
    .exec()
    .then(async (docs) => {
      res.status(200).json(docs);
    })
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
            const user = new User({
              _id: new mongoose.Types.ObjectId(),
              username: req.body.username,
              email: req.body.email,
              password: hash,
              role: "member",
              bio: "",
              picture:
                "https://i.imgur.com/W3BqaHd_d.webp?maxwidth=760&fidelity=grand",
              verified: false,
            });
            user
              .save()
              .then((result) => {
                console.log(result);
                mailer
                  .sendEmail(
                    process.env.AUTH_USER,
                    req.body.email,
                    "MemeShare: Email verification",
                    `Press <a href=https://memeshare-server01.herokuapp.com/user/verify/${result._id}> here </a> to verify your account.`
                  )
                  .then(() =>
                    res.status(201).json({
                      message: "User created",
                    })
                  )
                  .catch((err) => {
                    res.status(500).json({ err });
                  });
              })
              .catch((err) => {
                res.status(500).json({
                  error: err,
                });
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
              picture: user[0].picture,
              role: user[0].role,
              bio: user[0].bio,
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

exports.userVerification = (req, res, next) => {
  User.update({ _id: req.params.user }, { $set: { verified: true } })
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
    .then((result) => {
      res.status(200).json({
        message: "User updated",
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
};

exports.deleteUser = (req, res, next) => {
  User.remove({ _id: req.params.userId })
    .exec()
    .then((result) => res.status(200).json({ message: "User deleted" }))
    .catch((err) => res.status(500).json({ error: err }));
};
