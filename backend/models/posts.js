const mongoose = require('mongoose')
const postSchema = mongoose.Schema({
    author: String,
    timestamp: {type:Date,default:()=> Date.now()},
    title:String,
    description:String,
    markdown:String
})
module.exports = mongoose.model('posts',postSchema)