const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const checkAuth = require('../middleware/check-auth.js');
 
const Post = require('../models/post');
 
router.get('/', (req, res, next) => {
    Post.find()
        .select('_id title description code createdBy')
        .exec()
        .then(docs => {
            res.status(200).json(
                docs.map(doc => {
                    return {
                        _id: doc._id,
                        title: doc.title,
                        description: doc.description,
                        code: doc.code,
                        createdBy: doc.createdBy,
                        request: {
                            type: "GET",
                            url: "http://localhost:3000/post/" + doc._id
                        }
                    }
                })
            );
        })
        .catch()
});
 
router.post('/', checkAuth, (req, res, next) => {
    const post = new Post({
        _id: new mongoose.Types.ObjectId(),
        title: req.body.title,
        description: req.body.description,
        code: req.body.code,
        createdBy: req.body.createdBy
    });
    post.save()
        .then(result => {
            res.status(200).json({
                message: 'Created the post successfully',
                createdPost: {
                    _id: result.id,
                    title: result.title,
                    description: result.description,
                    code: result.code,
                    createdBy: result.createdBy,
                    request: {
                        type: "GET",
                        url: "http://localhost:3000/post/" + result._id
                    }
                }
            })
        })
        .catch(err => res.status(500).json({ error: err }))
});
 
router.get('/:postId', (req, res, next) => {
    const id = req.params.postId;
    Post.findById(id)
        .select('_id title description code createdBy')
        .exec()
        .then(doc => {
            if (doc) {
                res.status(200).json(doc)
            } else {
                res.status(404).json({
                    message: "No valid entry found for provided ID"
                })
            }
        })
        .catch(err => {
            res.status(500).json({ error: err })
        })
});
 
router.delete('/:postId', (req, res, next) => {
    const id = req.params.postId;
    Post.remove({ _id: id })
        .exec()
        .then(result => {
            res.status(200).json({
                message: "Post deleted"
            })
        })
        .catch(err => {
            res.status(500).json({ error: err })
        })
});
 
module.exports = router;