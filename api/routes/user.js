const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const checkAuth = require('../middleware/check-auth.js');

const User = require('../models/user');
const Post = require('../models/post');
const { json } = require('body-parser');

router.get("/", checkAuth, (req, res, next) => {
    var usersData = []

    User.find()
        .exec()
        .then(async docs => {
            const Posts = await Post.find();

            await docs.forEach(async element => {
                await usersData.push({
                    _id: element._id,
                    username: element.username,
                    role: element.role,
                    bio: element.bio,
                    followers: element.followers,
                    following: element.following,
                    posts: Posts.filter(Post => Post.createdBy.get('username') === element.username)
                })
            });
            res.status(200).json(usersData);
        })
        .catch(err => res.status(500).json({ error: err }))
});

router.post("/signup", (req, res, next) => {
    User.find({ email: req.body.email })
        .exec()
        .then(user => {
            if (user.length >= 1) {
                return res.status(409).json({
                    message: "Mail exists"
                });
            } else {
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if (err) {
                        return res.status(500).json({
                            error: err
                        });
                    } else {
                        const user = new User({
                            _id: new mongoose.Types.ObjectId(),
                            username: req.body.username,
                            email: req.body.email,
                            password: hash,
                            role: 'member',
                            bio: '',
                            followers: [],
                            following: []
                        });
                        user
                            .save()
                            .then(result => {
                                res.status(201).json({
                                    message: "User created"
                                });
                            })
                            .catch(err => {
                                res.status(500).json({
                                    error: err
                                });
                            });
                    }
                });
            }
        });
});

router.post("/login", (req, res, next) => {
    User.find({ username: req.body.username })
        .exec()
        .then(user => {
            if (user.length < 1) {
                return res.status(401).json({
                    message: "Auth failed"
                });
            }
            bcrypt.compare(req.body.password, user[0].password, (err, result) => {
                if (err) {
                    return res.status(401).json({
                        message: "Auth failed"
                    });
                }
                if (result) {
                    const token = jwt.sign(
                        {
                            userId: user[0]._id,
                            username: user[0].username,
                            role: user[0].role
                        },
                        process.env.PRIVATE_KEY,
                        {
                            expiresIn: "1h"
                        }
                    );
                    return res.status(200).json({
                        message: "Auth successful",
                        token: token
                    });
                }
                res.status(401).json({
                    message: "Auth failed"
                });
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

router.get('/:user', (req, res, next) => {
    var user = req.params.user;

    User.find({ username: user })
        .select('_id username role bio followers following')
        .exec()
        .then(async doc => {
            const Posts = await Post.find();

            res.status(200).json({
                _id: doc[0]._id,
                username: doc[0].username,
                role: doc[0].role,
                bio: doc[0].bio,
                followers: doc[0].followers,
                following: doc[0].following,
                posts: Posts.filter(Post => Post.createdBy.get('username') === user)
            })
        })
        .catch(err => res.status(500).json({ err }))

    // User.find({ username: user })
    //     .select('_id username role bio followers following')
    //     .exec()
    //     .then(async doc => {
    //         const Posts = await Post.find();
    //         const UserData = {
    //             _id: doc._id,
    //             username: doc.username,
    //             role: doc.role,
    //             bio: doc.bio,
    //             followers: doc.followers,
    //             following: doc.following,
    //             posts: Posts.filter(Post => Post.createdBy.get('username') === doc.username)
    //         }
    //         console.log(UserData)
    //         res.status(200)

    //     })
    //     .catch(err => {
    //         res.status(500).json({ error: err })
    //     })
});

router.patch('/:userId', checkAuth, (req, res, next) => {
    const id = req.params.userId;
    const updateOps = {};
    for (const ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    User.update({ _id: id }, { $set: updateOps })
        .exec()
        .then(result => {
            res.status(200).json({
                message: 'User updated'
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
});

router.delete('/:userId', checkAuth, (req, res, next) => {
    User.remove({ _id: req.params.userId })
        .exec()
        .then(result => res.status(200).json({ message: 'User deleted' }))
        .catch(err => res.status(500).json({ error: err }));
})

module.exports = router;