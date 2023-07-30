const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const Users = require('./models/users')
const Posts = require('./models/posts')
const Subscriptions = require('./models/subscription')
const cookieParser = require('cookie-parser');
require("dotenv").config();
const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())
app.use(express.static('static'));
mongoose.connect(process.env.MONGODB)
app.post('/api/signup',async (req,res)=>{
    if(await Users.count({email:req.body.email})==0){
        const user = await Users(req.body)
        user.save()
        res.json({status:1,message:"success"})
    }
    else res.json({status:0,message:"email already exists"})
})
app.post('/api/login',async(req,res)=>{
    const user = await Users.findOne({email:req.body.email})
    if(!user)res.json({status:0,message:"user does not exist"})
    else if(user.password!=req.body.password)res.json({status:0,message:"incorrect password"})
    else {
        res.cookie('uuid',user._id)
        res.json({status:1,message:"success"})
    }

})
app.get('/api/logout',(req,res)=>{
    res.clearCookie("uuid")
    res.redirect("/")
})
app.get('/api/userDetails',async(req,res)=>{
    if(req.cookies.uuid){
    const u = await Users.findOne({_id:req.cookies.uuid})
        following= await Subscriptions.find({user:u.email})
    following = await Promise.all(following.map(async (f)=>{
        a = await Users.findOne({email:f.subscribedTo});
        return a.email
    }))
    followers= await Subscriptions.find({subscribedTo:u.email})
    followers = await Promise.all(followers.map(async (f)=>{
        a = await Users.findOne({email:f.user});
        return a.email
    }))
    res.json({isLoggedIn:1,email:u.email,following:following,followers_cnt:followers.length})
    }
    else res.json({isLoggedIn:0})
})
app.get('/api/homeFeed',async(req,res)=>{
    const all = await Posts.find().sort({timestamp:-1})
    if(!req.cookies.uuid){
        res.json({all:all})
    }
    else{
    const u = await Users.findOne({_id:req.cookies.uuid})
    const new_feed = await Posts.find({timestamp:{$gte:u.lastvisited}}).sort({timestamp:-1})
    var following = await Subscriptions.find({user:u.email})
    following = following.map((f)=>f.subscribedTo)
    const subscribed_posts =await Posts.find({author:{$in:following},timestamp:{$lt:u.lastvisited}}).sort({timestamp:-1})
    u.lastvisited = Date.now()
    await u.save()
    res.json({all:all,caughtUp:subscribed_posts,newFeed:new_feed})}

})
app.post('/api/create',async(req,res)=>{
    req.body.author=await Users.findOne({_id:req.cookies.uuid})
    req.body.author = req.body.author.email
    const post = new Posts(req.body)
    await post.save()
    res.redirect('/dashboard')
})
app.post('/api/delete',async(req,res)=>{
    await Posts.deleteOne({_id:req.body.id})
    res.redirect('/dashboard')
})
app.get('/api/view/:id',async(req,res)=>{
    const post = await Posts.findOne({_id:req.params.id})
    res.json(post)
})
app.get('/api/posts',async(req,res)=>{
    const a = await Users.findOne({_id:req.cookies.uuid})
    const posts = await Posts.find({author:a.email})
    res.json(posts)
})
app.get('/api/authorposts/:author',async(req,res)=>{
    const posts= await Posts.find({author:req.params.author}).sort({timestamp:1})
    res.json(posts)
})
app.get('/api/subscribe/:author',async(req,res)=>{
    const u = await Users.findOne({_id:req.cookies.uuid})
    const s = await Subscriptions({user:u.email,subscribedTo:req.params.author})
    s.save()
    res.json()

})
app.get('/api/unsubscribe/:author',async(req,res)=>{
    const u = await Users.findOne({_id:req.cookies.uuid})
    await Subscriptions.deleteOne({user:u.email,subscribedTo:req.params.author})
    res.json()

})
app.get('/api/following',async(req,res)=>{
    const u = await Users.findOne({_id:req.cookies.uuid})
    following= await Subscriptions.find({user:u.email})
    following = await Promise.all(following.map(async (f)=>{
        a = await Users.findOne({email:f.subscribedTo});
        return a.email
    }))
    res.json({
        count:following.length,
        list:following
})})
app.get('/api/followers',async(req,res)=>{
    const u = await Users.findOne({_id:req.cookies.uuid})
    followers= await Subscriptions.find({subscribedTo:u.email})
    followers = await Promise.all(followers.map(async (f)=>{
        a = await Users.findOne({email:f.user});
        return a.email
    }))
    res.json({
        count:followers.length,
        list:followers
})})
app.listen(4000,console.log('server ready....'))


