require("dotenv").config()

const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

const userSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true },
    hash: { type: String, required: true },
    appointments: [{
        date: { type: Date, required: true },
        label: String
    }]  
})   

const User = mongoose.model("User", userSchema)

function saveReminder(saveData, callback){
    let username = saveData.name

    User.findOneAndUpdate({ name: username },
        { $push: { appointments: { date: saveData.date, label: saveData.label }}},
        {new: true}, (err, data) => callback(data))
    
}

function createUser(user, callback){
    const newUser = new User({ 
        ...user,
        appointments: [] 
    })
    newUser.save((err, data) => {     
        callback(err, data)
    }) 
}

async function getUserInfo(requestInfo){
    const user = await User.findOne({ name: requestInfo.name })
    return user ?? { error: "User doesn't exist" }
}

exports.saveReminder = saveReminder
exports.createUser = createUser
exports.getUserInfo = getUserInfo
 