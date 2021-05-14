const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const checkAuth = require("../middleware/check-auth.js");

const User = require("../models/user");

router.get("/", checkAuth, (req, res, next) => {
  User.find()
    .select("_id username email followers following role bio verified")
    .exec()
    .then(async (docs) => {
      res.status(200).json(docs);
    })
    .catch((err) => res.status(500).json({ error: err }));
});

router.get("/verify/:user", (req, res, next) => {
  User.update({ _id: req.params.user }, { $set: { verified: true } })
    .exec()
    .then(() => res.redirect("https://meme-share.netlify.app/"))
    .catch((err) => res.status(500).json({ error: err }));
});

router.post("/signup", (req, res, next) => {
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
          }
        });
      }
    });
});

router.post("/signin", (req, res, next) => {
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
              bio: user[0].role
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
});

router.get("/:user", checkAuth, (req, res, next) => {
  var user = req.params.user;

  User.find({ username: user })
    .select("_id username role bio followers following verified")
    .exec()
    .then((doc) => {
      res.status(200).json(doc[0]);
    })
    .catch((err) => res.status(500).json({ err }));
});

router.patch("/:user", checkAuth, (req, res, next) => {
  var user = req.params.user;

  const updateOps = {};
  for (const ops of req.body) {
    updateOps[ops.propName] = ops.value;
  }
  User.update({ username: user }, { $set: updateOps })
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
});

router.delete("/:userId", checkAuth, (req, res, next) => {
  User.remove({ _id: req.params.userId })
    .exec()
    .then((result) => res.status(200).json({ message: "User deleted" }))
    .catch((err) => res.status(500).json({ error: err }));
});

module.exports = router;
