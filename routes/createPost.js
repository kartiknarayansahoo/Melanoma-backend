const express = require("express")
const router = express.Router()
const mongoose = require('mongoose')
const requireLogin = require('../middlewares/requireLogin')
const POST = mongoose.model("POST")
const fetch = require("node-fetch");

// Routes
router.get("/allPosts", requireLogin, (req, res) => {
    POST.find()
        .populate("postedBy", "_id, name Photo")
        .populate("comments.postedBy", "_id name Photo")
        .sort("-createdAt")
        .then(posts => { res.json(posts) })
        .catch(err => console.log(err))
})

router.post("/createPost", requireLogin, async (req, res) => {
    const { body, pic } = req.body
    if (!body || !pic) {
        return res.status(422).json({ error: "Please add all the fields" })
    }

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ "url": pic }),
        // body: JSON.stringify({ key: 'value' }),
    };
    // console.log(requestOptions.body);
    let type;
    try {
        const response = await fetch("http://localhost:8000/skinimage", requestOptions);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        type = await response.json();
        data = JSON.stringify(type);
        console.log(type);
      
        // console.log("API Response:", type);
    } catch (error) {
        console.error("API Error:", error.message);
    }
    // console.log(type)
    const post = new POST({
        body: type.result,
        photo: pic,
        postedBy: req.user,
        filter:type.url_list
        
    })

    post.save().then((result) => {
        // type = null;
        // console.log(type)
        console.log({ post: result})
        return res.json({ post: result})
         
    }).catch((err) => {
        console.log("errror:", err);
    })
})

router.get("/myposts", requireLogin, (req, res) => {
    POST.find({ postedBy: req.user._id })
        .populate("postedBy", "_id name Photo")
        .populate("comments.postedBy", "_id name Photo")
        .sort("-createdAt")
        .then(myposts => res.json(myposts))
})

router.put("/like", requireLogin, (req, res) => {
    POST.findByIdAndUpdate(req.body.postId, {
        $push: { likes: req.user._id }
    }, {
        new: true
    }).populate("postedBy", "_id name Photo")
        .then(result => { res.json(result) })
        .catch(err => { res.json({ error: err }) })
})

router.put("/unlike", requireLogin, (req, res) => {
    POST.findByIdAndUpdate(req.body.postId, {
        $pull: { likes: req.user._id }
    }, {
        new: true
    }).populate("postedBy", "_id name Photo")
        .then(result => { res.json(result) })
        .catch(err => { res.json({ error: err }) })
})

router.put("/comment", requireLogin, (req, res) => {
    const comment = {
        comment: req.body.text,
        postedBy: req.user._id
    }
    POST.findByIdAndUpdate(req.body.postId, {
        $push: { comments: comment }
    }, {
        new: true
    })
        .populate("comments.postedBy", "_id name")
        .populate("postedBy", "_id name Photo")
        .then(result => { res.json(result) })
        .catch(err => { res.json({ error: err }) })
})

router.delete("/deletePost/:postId", requireLogin, (req, res) => {
    POST.findOne({ _id: req.params.postId })
        .populate("postedBy", "_id")
        .then(post => {
            if (post.postedBy._id.toString() === req.user._id.toString()) {
                post.deleteOne()
                    .then(result => {
                        return res.json({ message: "Successfully deleted" })
                    }).catch((err) => {
                        console.log(err);
                    })
            }
        })
        .catch(err => {
            console.log('error: ', err);
            res.status(422).json({ error: err })
        })
})


// to show following post
router.get("/myfollowingpost", requireLogin, (req, res) => {
    POST.find({ postedBy: { $in: req.user.following } })
        .populate("postedBy", "_id name Photo")
        .populate("comments.postedBy", "_id name")
        .then(posts => res.json(posts))
        .catch(err => {
            console.log(err);
        })
})

module.exports = router