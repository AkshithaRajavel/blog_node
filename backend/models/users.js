const mongoose = require('mongoose')
const userSchema = mongoose.Schema({
    email : {type:String,required:true},
    password: {type:String,required:true},
    lastvisited:Date
})
module.exports = mongoose.model('users',userSchema)