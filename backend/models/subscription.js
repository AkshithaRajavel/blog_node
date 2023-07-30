const mongoose = require('mongoose')
const subscribeSchema = mongoose.Schema({
    user : String,
    subscribedTo : String
})
module.exports = mongoose.model('subscriptions',subscribeSchema)